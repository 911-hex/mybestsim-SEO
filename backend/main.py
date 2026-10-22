import os
import time
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

load_dotenv()

API_KEY = os.getenv("ESIM_GO_API_KEY", "").strip()
BASE_URL = "https://api.esim-go.com/v2.5"
CACHE_TTL = int(os.getenv("CATALOGUE_CACHE_TTL_SECONDS", "1800"))

app = FastAPI(
    title="MyBestSim eSIM Recommendations API",
    version="1.1.0",
)

origins = [
    item.strip()
    for item in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5500,http://127.0.0.1:5500,"
        "http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if item.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

_catalogue_cache: list[dict[str, Any]] = []
_cache_time: float | None = None
_verified_at: str | None = None


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def number(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def unwrap_catalogue(payload: Any) -> list[dict[str, Any]]:
    """Support an array or common catalogue-envelope structures."""
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]

    if isinstance(payload, dict):
        possible_keys = (
            "bundles",
            "catalogue",
            "catalog",
            "data",
            "items",
            "results",
            "products",
        )

        for key in possible_keys:
            value = payload.get(key)
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]

        for key in possible_keys:
            value = payload.get(key)
            if isinstance(value, dict):
                try:
                    return unwrap_catalogue(value)
                except ValueError:
                    pass

        structure = {
            key: type(value).__name__
            for key, value in payload.items()
        }
        raise ValueError(
            f"Unexpected catalogue structure. Top-level fields: {structure}"
        )

    raise ValueError(
        f"Unexpected catalogue JSON type: {type(payload).__name__}"
    )


async def fetch_catalogue(
    refresh: bool = False,
) -> tuple[list[dict[str, Any]], str]:
    global _catalogue_cache, _cache_time, _verified_at

    if (
        not refresh
        and _catalogue_cache
        and _cache_time is not None
        and time.time() - _cache_time < CACHE_TTL
    ):
        return _catalogue_cache, _verified_at or now_utc()

    if not API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ESIM_GO_API_KEY is missing from the backend .env file.",
        )

    headers = {
        "X-API-Key": API_KEY,
        "Accept": "application/json",
    }

    all_items: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        page = 1
        per_page = 100

        while True:
            try:
                response = await client.get(
                    f"{BASE_URL}/catalogue",
                    headers=headers,
                    params={"page": page, "perPage": per_page},
                )
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Could not reach eSIM Go: {type(exc).__name__}",
                ) from exc

            if response.status_code in (401, 403):
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"eSIM Go returned HTTP {response.status_code}. "
                        "Check the API key and any account/IP restrictions."
                    ),
                )

            if response.status_code == 429:
                raise HTTPException(
                    status_code=503,
                    detail="eSIM Go rate limit reached. Try again later.",
                )

            if response.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "eSIM Go catalogue request failed with HTTP "
                        f"{response.status_code}."
                    ),
                )

            try:
                payload = response.json()
            except ValueError as exc:
                raise HTTPException(
                    status_code=502,
                    detail="eSIM Go returned a response that is not valid JSON.",
                ) from exc

            try:
                items = unwrap_catalogue(payload)
            except ValueError as exc:
                raise HTTPException(status_code=502, detail=str(exc)) from exc

            all_items.extend(items)

            metadata = payload if isinstance(payload, dict) else {}
            total_pages = number(
                metadata.get("totalPages")
                or metadata.get("total_pages")
                or metadata.get("pages")
            )

            if total_pages is not None:
                if page >= total_pages:
                    break
            elif len(items) < per_page:
                break

            page += 1
            if page > 100:
                raise HTTPException(
                    status_code=502,
                    detail="Catalogue pagination exceeded the safety limit.",
                )

    _catalogue_cache = all_items
    _cache_time = time.time()
    _verified_at = now_utc()
    return _catalogue_cache, _verified_at


def get_countries(bundle: dict[str, Any]) -> list[dict[str, Any]]:
    result = []

    for key in ("countries", "roamingEnabled", "countryNetworks"):
        entries = bundle.get(key)
        if not isinstance(entries, list):
            continue

        for entry in entries:
            if not isinstance(entry, dict):
                continue

            country = entry.get("country")
            if not isinstance(country, dict):
                country = entry

            iso = country.get("iso") or country.get("isoCode")
            name = country.get("name") or country.get("countryName")

            if iso or name:
                result.append({"iso": iso, "name": name})

    unique = {}
    for country in result:
        key = (
            str(country.get("iso") or "").upper(),
            str(country.get("name") or "").casefold(),
        )
        unique[key] = country

    return list(unique.values())


def matches_destination(
    bundle: dict[str, Any],
    destination: str,
) -> bool:
    target = destination.strip().casefold()
    return any(
        target in {
            str(country.get("iso") or "").casefold(),
            str(country.get("name") or "").casefold(),
        }
        for country in get_countries(bundle)
    )


def get_data_amount(bundle: dict[str, Any]) -> float | None:
    return number(bundle.get("dataAmount"))


def get_duration(bundle: dict[str, Any]) -> float | None:
    return number(bundle.get("duration"))


def get_networks(bundle: dict[str, Any], destination: str | None = None) -> list[dict[str, Any]]:
    """Extract network labels only when the catalogue actually provides them."""
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, tuple[str, ...]]] = set()

    # eSIM Go v2.5 documents countryNetworks; some responses also nest networks
    # directly under countries. Accept either shape without fabricating values.
    for key in ("countryNetworks", "countries"):
        entries = bundle.get(key)
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            country = entry.get("country")
            if not isinstance(country, dict):
                country = entry
            country_name = country.get("name") or country.get("iso") or ""
            country_iso = country.get("iso") or country.get("isoCode") or ""
            if destination:
                target = destination.strip().casefold()
                if target not in {str(country_name).casefold(), str(country_iso).casefold()}:
                    continue
            networks = entry.get("networks")
            if not isinstance(networks, list):
                continue
            names = sorted({
                str(network.get("brandName") or network.get("name"))
                for network in networks
                if isinstance(network, dict) and (network.get("brandName") or network.get("name"))
            })
            if not names:
                continue
            signature = (str(country_name), tuple(names))
            if signature in seen:
                continue
            seen.add(signature)
            result.append({"country": country_name or None, "names": names})
    return result


def normalize_offer(
    bundle: dict[str, Any],
    destination: str,
) -> dict[str, Any]:
    countries = get_countries(bundle)
    data_mb = get_data_amount(bundle)
    duration_days = get_duration(bundle)
    price = number(bundle.get("price"))
    currency = bundle.get("currency") or os.getenv("ESIM_GO_CURRENCY")

    destination_match = next(
        (
            country for country in countries
            if destination.strip().casefold() in {
                str(country.get("iso") or "").casefold(),
                str(country.get("name") or "").casefold(),
            }
        ),
        None,
    )

    unknowns = []
    if data_mb is None and bundle.get("unlimited") is not True:
        unknowns.append("Volume de données non fourni.")
    if duration_days is None:
        unknowns.append("Durée de validité non fournie.")
    if price is None:
        unknowns.append("Prix fournisseur non fourni.")
    if not currency:
        unknowns.append("Devise du prix non confirmée.")
    if not countries:
        unknowns.append("Pays couverts non renseignés.")

    unknowns.append(
        "Connexion en mer ou par satellite non confirmée par le catalogue."
    )

    networks = get_networks(bundle, destination)

    return {
        "provider": "eSIM Go",
        "offer_name": bundle.get("name"),
        "description": bundle.get("description"),
        "destination_match": destination_match,
        "covered_countries": countries,
        "data_amount_mb": data_mb,
        "unlimited": bundle.get("unlimited"),
        "duration_days": duration_days,
        "provider_price": price,
        "currency": currency,
        "billing_type": bundle.get("billingType"),
        "groups": bundle.get("groups") or [],
        "networks_in_destination": sorted({name for group in networks for name in group["names"]}),
        "source_url": "https://docs.esim-go.com/",
        "unknowns": unknowns,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "api_key_configured": bool(API_KEY)}


@app.get("/api/catalogue")
async def catalogue(
    destination: str | None = None,
    refresh: bool = False,
):
    items, verified_at = await fetch_catalogue(refresh=refresh)

    if destination:
        items = [
            item for item in items
            if matches_destination(item, destination)
        ]

    offers = [
        {
            "name": item.get("name"),
            "description": item.get("description"),
            "countries": get_countries(item),
            "data_amount_mb": get_data_amount(item),
            "unlimited": item.get("unlimited"),
            "duration_days": get_duration(item),
            "provider_price": number(item.get("price")),
            "currency": item.get("currency") or os.getenv("ESIM_GO_CURRENCY"),
            "groups": item.get("groups") or [],
            "networks": get_networks(item, destination),
        }
        for item in items
    ]

    return {
        "provider": "eSIM Go",
        "verified_at_utc": verified_at,
        "cache_ttl_seconds": CACHE_TTL,
        "count": len(offers),
        "offers": offers,
    }


@app.get("/api/recommendations")
async def recommendations(
    destination: str = Query(..., min_length=2),
    duration: int = Query(..., ge=1, le=365),
    usage: str = Query(default="medium", pattern="^(low|medium|high)$"),
    at_sea: bool = False,
    limit: int = Query(default=5, ge=1, le=20),
):
    items, verified_at = await fetch_catalogue()

    matching = [
        item for item in items
        if matches_destination(item, destination)
    ]

    candidates = []
    for item in matching:
        offer = normalize_offer(item, destination)
        validity = offer["duration_days"]

        if validity is not None and validity < duration:
            continue

        candidates.append(offer)

    def ranking(offer):
        price = offer["provider_price"]
        data_mb = offer["data_amount_mb"]
        unlimited = offer["unlimited"] is True

        if usage == "high":
            data_rank = (
                0 if unlimited
                else -(data_mb if data_mb is not None else -1)
            )
        elif usage == "low":
            data_rank = (
                0 if data_mb is not None and not unlimited
                else 1
            )
        else:
            data_rank = 0 if data_mb is not None else 1

        return (
            data_rank,
            price is None,
            price if price is not None else float("inf"),
            offer["duration_days"]
            if offer["duration_days"] is not None
            else float("inf"),
        )

    candidates.sort(key=ranking)
    selected = candidates[:limit]

    return {
        "provider": "eSIM Go",
        "verified_at_utc": verified_at,
        "destination_requested": destination,
        "trip_duration_days": duration,
        "usage_profile": usage,
        "usage_profile_note": (
            "Profil indicatif de classement. Aucun volume de données "
            "précis n'est supposé à partir de ce profil."
        ),
        "at_sea_requested": at_sea,
        "at_sea_note": (
            "Connexion en mer non confirmée par le catalogue eSIM Go."
            if at_sea
            else "Compatibilité en mer non évaluée."
        ),
        "count": len(selected),
        "total_matching_before_limit": len(candidates),
        "offers": selected,
    }


# Servir l’article depuis le même serveur que l’API pour éviter les erreurs CORS.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if (FRONTEND_DIR / "index.html").is_file():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
