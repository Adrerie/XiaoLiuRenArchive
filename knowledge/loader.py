"""Local knowledge loading and deterministic interpretation selection.

This module is deliberately data-driven.  It never computes a palace, changes
knowledge status, or manufactures interpretation text.
"""

from __future__ import annotations

import copy
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from types import MappingProxyType
from typing import Any, Iterable, Mapping, Sequence


PALACE_IDS = ("da_an", "liu_lian", "su_xi", "chi_kou", "xiao_ji", "kong_wang")
_PALACE_ID_SET = frozenset(PALACE_IDS)
_ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
_DOMAIN_ID_RE = re.compile(r"^[a-z][a-z0-9_]*$")
_SOURCE_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


class KnowledgeError(Exception):
    """Base typed error for local knowledge failures."""

    code = "KNOWLEDGE_ERROR"

    def __init__(self, message: str, *, details: Mapping[str, Any] | None = None):
        super().__init__(message)
        self.details = dict(details or {})


class KnowledgeLoadError(KnowledgeError):
    code = "KNOWLEDGE_LOAD_ERROR"


class KnowledgeIntegrityError(KnowledgeError):
    code = "KNOWLEDGE_INTEGRITY_ERROR"


class KnowledgeReferenceError(KnowledgeIntegrityError):
    """A knowledge object refers to an absent source or knowledge ID."""

    code = "KNOWLEDGE_MISSING_REFERENCE"


def _freeze(value: Any) -> Any:
    if isinstance(value, dict):
        return MappingProxyType({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value


def _plain(value: Any) -> Any:
    """Return a JSON-compatible copy of a frozen knowledge value."""
    if isinstance(value, Mapping):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [_plain(item) for item in value]
    return value


def _read_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise KnowledgeLoadError(
            f"Unable to load local knowledge file: {path}", details={"path": str(path)}
        ) from exc
    if not isinstance(value, dict):
        raise KnowledgeLoadError(
            f"Knowledge file must contain an object: {path}", details={"path": str(path)}
        )
    return value


def _require_object(value: Any, label: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise KnowledgeIntegrityError(f"{label} must be an object", details={"field": label})
    return value


def _require_list(value: Any, label: str) -> Sequence[Any]:
    if not isinstance(value, (list, tuple)):
        raise KnowledgeIntegrityError(f"{label} must be an array", details={"field": label})
    return value


def _require_keys(value: Mapping[str, Any], keys: Iterable[str], label: str) -> None:
    missing = [key for key in keys if key not in value]
    if missing:
        raise KnowledgeIntegrityError(
            f"{label} is missing required fields", details={"field": label, "missing": missing}
        )


def _validate_id(value: Any, pattern: re.Pattern[str], label: str) -> str:
    if not isinstance(value, str) or not pattern.fullmatch(value):
        raise KnowledgeIntegrityError(f"Invalid {label}", details={"field": label, "value": value})
    return value


def _validate_source_ids(value: Any, label: str) -> tuple[str, ...]:
    values = _require_list(value, label)
    if len(set(values)) != len(values):
        raise KnowledgeIntegrityError(f"Duplicate source ID in {label}", details={"field": label})
    return tuple(_validate_id(item, _SOURCE_ID_RE, label) for item in values)


def _validate_palaces(data: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    _require_keys(data, ("schemaVersion", "knowledgeVersion", "palaces"), "palaces")
    rows = _require_list(data["palaces"], "palaces.palaces")
    if len(rows) != len(PALACE_IDS):
        raise KnowledgeIntegrityError("MVP must contain exactly six palaces", details={"count": len(rows)})
    ids: list[str] = []
    frozen: list[Mapping[str, Any]] = []
    for index, row in enumerate(rows):
        item = _require_object(row, f"palaces.palaces[{index}]")
        _require_keys(item, ("id", "order", "name", "classical", "semanticCore", "modernGeneral", "sourceIds"), f"palaces.palaces[{index}]")
        palace_id = _validate_id(item["id"], re.compile(r"^[a-z][a-z0-9_]*$"), f"palaces.palaces[{index}].id")
        ids.append(palace_id)
        _validate_source_ids(item["sourceIds"], f"palaces.palaces[{index}].sourceIds")
        frozen.append(_freeze(dict(item)))
    if tuple(ids) != PALACE_IDS:
        raise KnowledgeIntegrityError(
            "Palace order or IDs do not match the frozen six-palace set",
            details={"expected": PALACE_IDS, "actual": ids},
        )
    return tuple(frozen)


def _validate_domains(data: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    _require_keys(data, ("schemaVersion", "knowledgeVersion", "status", "compositionPolicy", "domains"), "question-domains")
    rows = _require_list(data["domains"], "question-domains.domains")
    frozen: list[Mapping[str, Any]] = []
    ids: set[str] = set()
    for index, row in enumerate(rows):
        item = _require_object(row, f"question-domains.domains[{index}]")
        _require_keys(item, ("id", "name", "description", "palaceInterpretations", "mandatoryEthicsRuleIds"), f"question-domains.domains[{index}")
        domain_id = _validate_id(item["id"], _DOMAIN_ID_RE, f"question-domains.domains[{index}].id")
        if domain_id in ids:
            raise KnowledgeIntegrityError("Duplicate domain ID", details={"domainId": domain_id})
        ids.add(domain_id)
        interpretations = _require_object(item["palaceInterpretations"], f"domain {domain_id}.palaceInterpretations")
        if set(interpretations) != _PALACE_ID_SET:
            raise KnowledgeReferenceError(
                f"Domain {domain_id} must define all six palace interpretations",
                details={"domainId": domain_id, "palaceIds": sorted(interpretations)},
            )
        for palace_id, interpretation in interpretations.items():
            block = _require_object(interpretation, f"domain {domain_id}.{palace_id}")
            _require_keys(block, ("summary", "supportive", "caution", "actionPrompts"), f"domain {domain_id}.{palace_id}")
            _require_list(block["actionPrompts"], f"domain {domain_id}.{palace_id}.actionPrompts")
            for fragment_id in block.get("fragmentIds", []):
                _validate_id(fragment_id, _ID_RE, f"domain {domain_id}.{palace_id}.fragmentIds")
        stages = item.get("stages", [])
        _require_list(stages, f"domain {domain_id}.stages")
        for stage_id in stages:
            _validate_id(stage_id, _DOMAIN_ID_RE, f"domain {domain_id}.stages")
        frozen.append(_freeze(dict(item)))
    return tuple(frozen)


def _validate_fragments(data: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    _require_keys(data, ("schemaVersion", "knowledgeVersion", "status", "assemblyPolicy", "fragments"), "interpretation-fragments")
    policy = _require_object(data["assemblyPolicy"], "interpretation-fragments.assemblyPolicy")
    _require_keys(policy, ("maxFragmentsPerSection", "deduplicateById", "preserveSourceTrace", "forbiddenBehavior"), "assemblyPolicy")
    if policy["deduplicateById"] is not True or policy["preserveSourceTrace"] is not True:
        raise KnowledgeIntegrityError("Fragment assembly policy must preserve IDs and source trace")
    rows = _require_list(data["fragments"], "interpretation-fragments.fragments")
    frozen: list[Mapping[str, Any]] = []
    ids: set[str] = set()
    for index, row in enumerate(rows):
        item = _require_object(row, f"fragments[{index}]")
        _require_keys(item, ("id", "kind", "text", "palaceIds", "domainIds", "stageIds", "tags", "claimTypes", "sourceIds", "status"), f"fragments[{index}]")
        fragment_id = _validate_id(item["id"], _ID_RE, f"fragments[{index}].id")
        if fragment_id in ids:
            raise KnowledgeIntegrityError("Duplicate fragment ID", details={"fragmentId": fragment_id})
        ids.add(fragment_id)
        palace_ids = _require_list(item["palaceIds"], f"fragments[{index}].palaceIds")
        if not set(palace_ids).issubset(_PALACE_ID_SET | {"all"}):
            raise KnowledgeReferenceError("Fragment refers to an unknown palace", details={"fragmentId": fragment_id, "palaceIds": list(palace_ids)})
        for domain_id in item["domainIds"]:
            _validate_id(domain_id, _DOMAIN_ID_RE, f"fragments[{index}].domainIds")
        for stage_id in item["stageIds"]:
            _validate_id(stage_id, _DOMAIN_ID_RE, f"fragments[{index}].stageIds")
        _validate_source_ids(item["sourceIds"], f"fragments[{index}].sourceIds")
        frozen.append(_freeze(dict(item)))
    return tuple(frozen)


def _validate_sources(data: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    _require_keys(data, ("schemaVersion", "updatedAt", "sources", "sourcePolicy"), "source-registry")
    rows = _require_list(data["sources"], "source-registry.sources")
    frozen: list[Mapping[str, Any]] = []
    ids: set[str] = set()
    for index, row in enumerate(rows):
        item = _require_object(row, f"sources[{index}]")
        _require_keys(item, ("id", "title", "type", "language", "url", "publisher", "authorityLevel", "supports", "doesNotSupport", "licenseNote", "ingestionPolicy", "verificationStatus"), f"sources[{index}]")
        source_id = _validate_id(item["id"], _SOURCE_ID_RE, f"sources[{index}].id")
        if source_id in ids:
            raise KnowledgeIntegrityError("Duplicate source ID", details={"sourceId": source_id})
        ids.add(source_id)
        if not isinstance(item["url"], str) or not item["url"].startswith("https://"):
            raise KnowledgeIntegrityError("Source URL must use HTTPS", details={"sourceId": source_id})
        frozen.append(_freeze(dict(item)))
    return tuple(frozen)


@dataclass(frozen=True)
class KnowledgeIndex:
    palaces: Mapping[str, Mapping[str, Any]]
    domains: Mapping[str, Mapping[str, Any]]
    fragments: Mapping[str, Mapping[str, Any]]
    sources: Mapping[str, Mapping[str, Any]]
    fragments_by_kind: Mapping[str, tuple[Mapping[str, Any], ...]]


@dataclass(frozen=True)
class KnowledgeBundle:
    palaces: tuple[Mapping[str, Any], ...]
    domains: tuple[Mapping[str, Any], ...]
    fragments: tuple[Mapping[str, Any], ...]
    sources: tuple[Mapping[str, Any], ...]
    assembly_policy: Mapping[str, Any]
    index: KnowledgeIndex
    metadata: Mapping[str, str]


def load_knowledge_bundle(data_dir: str | Path | None = None) -> KnowledgeBundle:
    """Load the four local MVP knowledge files into an immutable bundle."""
    root = Path(data_dir) if data_dir is not None else Path(__file__).resolve().parent
    palaces_data = _read_json(root / "palaces.v1.json")
    domains_data = _read_json(root / "question-domains.v1.json")
    fragments_data = _read_json(root / "interpretation-fragments.v1.json")
    sources_data = _read_json(root / "source-registry.json")

    palaces = _validate_palaces(palaces_data)
    domains = _validate_domains(domains_data)
    fragments = _validate_fragments(fragments_data)
    sources = _validate_sources(sources_data)
    source_index = {item["id"]: item for item in sources}

    for item in (*palaces, *fragments):
        for source_id in item["sourceIds"]:
            if source_id not in source_index:
                raise KnowledgeReferenceError(
                    f"Unknown source reference: {source_id}",
                    details={"sourceId": source_id, "ownerId": item["id"]},
                )
    domain_index = {item["id"]: item for item in domains}
    fragment_index = {item["id"]: item for item in fragments}
    for domain in domains:
        for palace_id, block in domain["palaceInterpretations"].items():
            for fragment_id in block.get("fragmentIds", []):
                if fragment_id not in fragment_index:
                    raise KnowledgeReferenceError(
                        f"Unknown domain fragment reference: {fragment_id}",
                        details={"domainId": domain["id"], "palaceId": palace_id, "fragmentId": fragment_id},
                    )
        for stage_id in domain.get("stages", []):
            if not isinstance(stage_id, str):
                raise KnowledgeIntegrityError("Domain stage ID must be a string", details={"domainId": domain["id"]})
    by_kind: dict[str, list[Mapping[str, Any]]] = {}
    for fragment in fragments:
        by_kind.setdefault(fragment["kind"], []).append(fragment)
    frozen_by_kind = MappingProxyType({kind: tuple(items) for kind, items in by_kind.items()})
    index = KnowledgeIndex(
        palaces=MappingProxyType({item["id"]: item for item in palaces}),
        domains=MappingProxyType(domain_index),
        fragments=MappingProxyType(fragment_index),
        sources=MappingProxyType(source_index),
        fragments_by_kind=frozen_by_kind,
    )
    return KnowledgeBundle(
        palaces=palaces,
        domains=domains,
        fragments=fragments,
        sources=sources,
        assembly_policy=_freeze(dict(fragments_data["assemblyPolicy"])),
        index=index,
        metadata=MappingProxyType({
            "knowledgeVersion": str(palaces_data["knowledgeVersion"]),
            "status": str(palaces_data["status"]),
            "schemaVersion": str(palaces_data["schemaVersion"]),
        }),
    )


@dataclass(frozen=True)
class SourceCitation:
    id: str
    title: str
    url: str
    authority_level: str
    verification_status: str

    def to_dict(self) -> dict[str, str]:
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "authorityLevel": self.authority_level,
            "verificationStatus": self.verification_status,
        }


@dataclass(frozen=True)
class SelectedFragment:
    id: str
    kind: str
    text: str
    palace_ids: tuple[str, ...]
    domain_ids: tuple[str, ...]
    stage_ids: tuple[str, ...]
    tags: tuple[str, ...]
    claim_types: tuple[str, ...]
    source_ids: tuple[str, ...]
    sources: tuple[SourceCitation, ...]
    status: str
    priority: int
    requires_ethics_rule_ids: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "kind": self.kind,
            "text": self.text,
            "palaceIds": list(self.palace_ids),
            "domainIds": list(self.domain_ids),
            "stageIds": list(self.stage_ids),
            "tags": list(self.tags),
            "claimTypes": list(self.claim_types),
            "sourceIds": list(self.source_ids),
            "sources": [source.to_dict() for source in self.sources],
            "status": self.status,
            "priority": self.priority,
            "requiresEthicsRuleIds": list(self.requires_ethics_rule_ids),
        }


@dataclass(frozen=True)
class DomainInterpretationBlock:
    domain_id: str
    palace_id: str
    summary: str
    supportive: str
    caution: str
    action_prompts: tuple[str, ...]
    fragment_ids: tuple[str, ...]
    tags: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "domainId": self.domain_id,
            "palaceId": self.palace_id,
            "summary": self.summary,
            "supportive": self.supportive,
            "caution": self.caution,
            "actionPrompts": list(self.action_prompts),
            "fragmentIds": list(self.fragment_ids),
            "tags": list(self.tags),
            "sourceIds": [],
        }


@dataclass(frozen=True)
class InterpretationTraceEvent:
    event: str
    object_id: str
    reason: str
    source_ids: tuple[str, ...] = field(default_factory=tuple)
    rule_ids: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": self.event,
            "objectId": self.object_id,
            "reason": self.reason,
            "sourceIds": list(self.source_ids),
            "ruleIds": list(self.rule_ids),
        }


@dataclass(frozen=True)
class InterpretationDraft:
    palace_id: str
    domain_id: str
    stage_id: str | None
    sections: Mapping[str, Any]
    candidate_claims: tuple[Mapping[str, Any], ...]
    trace: tuple[InterpretationTraceEvent, ...]

    def to_dict(self) -> dict[str, Any]:
        sections: dict[str, Any] = {}
        for name, value in self.sections.items():
            if isinstance(value, DomainInterpretationBlock):
                sections[name] = value.to_dict()
            elif isinstance(value, tuple):
                sections[name] = [item.to_dict() if isinstance(item, SelectedFragment) else _plain(item) for item in value]
            else:
                sections[name] = _plain(value)
        return {
            "palaceId": self.palace_id,
            "domainId": self.domain_id,
            "stageId": self.stage_id,
            "sections": sections,
            "candidateClaims": [_plain(claim) for claim in self.candidate_claims],
            "trace": [event.to_dict() for event in self.trace],
        }


def _validate_context(bundle: KnowledgeBundle, palace_id: str, domain_id: str, stage_id: str | None) -> Mapping[str, Any]:
    if palace_id not in bundle.index.palaces:
        raise KnowledgeReferenceError("Unknown palace reference", details={"palaceId": palace_id})
    domain = bundle.index.domains.get(domain_id)
    if domain is None:
        raise KnowledgeReferenceError("Unknown domain reference", details={"domainId": domain_id})
    if stage_id is not None and stage_id not in domain.get("stages", ()):
        raise KnowledgeReferenceError(
            "Stage does not belong to the selected domain",
            details={"domainId": domain_id, "stageId": stage_id},
        )
    if palace_id not in domain["palaceInterpretations"]:
        raise KnowledgeReferenceError("Domain has no palace interpretation", details={"domainId": domain_id, "palaceId": palace_id})
    return domain


def _source_citations(bundle: KnowledgeBundle, fragment: Mapping[str, Any]) -> tuple[SourceCitation, ...]:
    citations: list[SourceCitation] = []
    for source_id in fragment["sourceIds"]:
        source = bundle.index.sources.get(source_id)
        if source is None:
            raise KnowledgeReferenceError(
                f"Unknown source reference: {source_id}",
                details={"sourceId": source_id, "ownerId": fragment["id"]},
            )
        citations.append(SourceCitation(
            id=source["id"],
            title=source["title"],
            url=source["url"],
            authority_level=source["authorityLevel"],
            verification_status=source["verificationStatus"],
        ))
    return tuple(citations)


def _selected_fragment(bundle: KnowledgeBundle, fragment: Mapping[str, Any]) -> SelectedFragment:
    return SelectedFragment(
        id=fragment["id"],
        kind=fragment["kind"],
        text=fragment["text"],
        palace_ids=tuple(fragment["palaceIds"]),
        domain_ids=tuple(fragment["domainIds"]),
        stage_ids=tuple(fragment["stageIds"]),
        tags=tuple(fragment["tags"]),
        claim_types=tuple(fragment["claimTypes"]),
        source_ids=tuple(fragment["sourceIds"]),
        sources=_source_citations(bundle, fragment),
        status=fragment["status"],
        priority=int(fragment.get("priority", 0)),
        requires_ethics_rule_ids=tuple(fragment.get("requiresEthicsRuleIds", ())),
    )


def select_fragments(
    bundle: KnowledgeBundle,
    *,
    kind: str,
    palace_id: str,
    domain_id: str | None = None,
    stage_id: str | None = None,
    active_ethics_rule_ids: Iterable[str] = (),
    max_items: int | None = None,
) -> tuple[SelectedFragment, ...]:
    """Select fragments by frozen contract predicates and stable ordering."""
    if palace_id not in bundle.index.palaces:
        raise KnowledgeReferenceError("Unknown palace reference", details={"palaceId": palace_id})
    if domain_id is not None and domain_id not in bundle.index.domains:
        raise KnowledgeReferenceError("Unknown domain reference", details={"domainId": domain_id})
    if stage_id is not None and domain_id is None:
        raise KnowledgeIntegrityError("A stage selection requires a domain", details={"stageId": stage_id})
    if stage_id is not None and stage_id not in bundle.index.domains[domain_id].get("stages", ()):
        raise KnowledgeReferenceError("Stage does not belong to the selected domain", details={"domainId": domain_id, "stageId": stage_id})
    enabled_rules = frozenset(active_ethics_rule_ids)
    candidates: list[Mapping[str, Any]] = []
    for fragment in bundle.index.fragments_by_kind.get(kind, ()):
        palace_match = palace_id in fragment["palaceIds"] or "all" in fragment["palaceIds"]
        if not palace_match:
            continue
        fragment_domains = frozenset(fragment["domainIds"])
        fragment_stages = frozenset(fragment["stageIds"])
        if kind == "stage_modifier":
            if domain_id not in fragment_domains or stage_id not in fragment_stages:
                continue
        elif fragment_domains and domain_id not in fragment_domains:
            continue
        if not frozenset(fragment.get("requiresEthicsRuleIds", ())).issubset(enabled_rules):
            continue
        candidates.append(fragment)
    unique: dict[str, Mapping[str, Any]] = {}
    for fragment in candidates:
        unique.setdefault(fragment["id"], fragment)
    ordered = sorted(unique.values(), key=lambda item: (-int(item.get("priority", 0)), item["id"]))
    limit = max_items if max_items is not None else int(bundle.assembly_policy["maxFragmentsPerSection"])
    if limit < 1:
        raise KnowledgeIntegrityError("Fragment section limit must be positive", details={"limit": limit})
    return tuple(_selected_fragment(bundle, fragment) for fragment in ordered[:limit])


def assemble_interpretation(
    bundle: KnowledgeBundle,
    *,
    palace_id: str,
    domain_id: str,
    stage_id: str | None = None,
    active_ethics_rule_ids: Iterable[str] = (),
    include_historical_context: bool = False,
) -> InterpretationDraft:
    """Build the local, structured interpretation draft without generating text."""
    domain = _validate_context(bundle, palace_id, domain_id, stage_id)
    enabled_rules = frozenset(active_ethics_rule_ids)
    neutral = select_fragments(bundle, kind="neutral_summary", palace_id=palace_id, domain_id=domain_id, active_ethics_rule_ids=enabled_rules, max_items=2)
    if len(neutral) != 1:
        raise KnowledgeIntegrityError(
            "Exactly one neutral palace fragment is required",
            details={"palaceId": palace_id, "count": len(neutral)},
        )
    domain_data = domain["palaceInterpretations"][palace_id]
    domain_block = DomainInterpretationBlock(
        domain_id=domain_id,
        palace_id=palace_id,
        summary=domain_data["summary"],
        supportive=domain_data["supportive"],
        caution=domain_data["caution"],
        action_prompts=tuple(domain_data["actionPrompts"]),
        fragment_ids=tuple(domain_data.get("fragmentIds", ())),
        tags=tuple(domain_data.get("tags", ())),
    )
    stage = select_fragments(bundle, kind="stage_modifier", palace_id=palace_id, domain_id=domain_id, stage_id=stage_id, active_ethics_rule_ids=enabled_rules) if stage_id else ()
    actions = select_fragments(bundle, kind="action_prompt", palace_id=palace_id, domain_id=domain_id, active_ethics_rule_ids=enabled_rules)
    historical = select_fragments(bundle, kind="historical_context", palace_id=palace_id, domain_id=domain_id, active_ethics_rule_ids=enabled_rules) if include_historical_context else ()
    reality = select_fragments(bundle, kind="reality_check", palace_id=palace_id, domain_id=domain_id, active_ethics_rule_ids=enabled_rules)
    ethics = select_fragments(bundle, kind="ethics_notice", palace_id=palace_id, domain_id=domain_id, stage_id=None, active_ethics_rule_ids=enabled_rules)
    trace = [InterpretationTraceEvent("context_validated", f"{domain_id}:{palace_id}", "local knowledge context validated")]
    for fragment in (*neutral, *stage, *actions, *historical, *reality, *ethics):
        trace.append(InterpretationTraceEvent("fragment_selected", fragment.id, "matched frozen selection predicates", fragment.source_ids, fragment.requires_ethics_rule_ids))
    return InterpretationDraft(
        palace_id=palace_id,
        domain_id=domain_id,
        stage_id=stage_id,
        sections={
            "neutral": neutral,
            "domain": domain_block,
            "stage": stage,
            "actions": actions,
            "historicalContext": historical,
            "realityChecks": reality,
            "ethicsNotices": ethics,
        },
        candidate_claims=(),
        trace=tuple(trace),
    )


__all__ = [
    "InterpretationDraft",
    "KnowledgeBundle",
    "KnowledgeError",
    "KnowledgeIndex",
    "KnowledgeIntegrityError",
    "KnowledgeLoadError",
    "KnowledgeReferenceError",
    "SelectedFragment",
    "SourceCitation",
    "assemble_interpretation",
    "load_knowledge_bundle",
    "select_fragments",
]
