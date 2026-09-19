import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Set, Optional
from collections import defaultdict
from dataclasses import dataclass, asdict


@dataclass
class GraphNode:
    id: str
    type: str  # email, domain, ip, url, attachment, campaign, threat_actor
    label: str
    properties: Dict[str, Any]
    risk_score: float
    first_seen: str
    last_seen: str
    confidence: float


@dataclass
class GraphEdge:
    source: str
    target: str
    relationship: str  # sent_from, resolves_to, contains, links_to, attributed_to, similar_to
    weight: float
    evidence: List[str]
    first_observed: str
    last_observed: str


class ThreatCorrelationGraph:
    """Graph-based threat correlation and campaign grouping"""
    
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.campaigns: Dict[str, Dict] = {}
        self.threat_actors: Dict[str, Dict] = {}
        
    def _generate_node_id(self, node_type: str, value: str) -> str:
        """Generate deterministic node ID"""
        return hashlib.sha256(f"{node_type}:{value}".encode()).hexdigest()[:16]
    
    def add_email_node(self, email_data: Dict) -> str:
        """Add email as central node"""
        msg_id = email_data.get("message_id", f"email_{datetime.utcnow().timestamp()}")
        node_id = self._generate_node_id("email", msg_id)
        
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(
                id=node_id,
                type="email",
                label=f"Email: {email_data.get('subject', 'No Subject')[:50]}",
                properties={
                    "message_id": msg_id,
                    "subject": email_data.get("subject"),
                    "from": email_data.get("from"),
                    "to": email_data.get("to"),
                    "date": email_data.get("date"),
                    "threat_type": email_data.get("threat_type"),
                    "severity": email_data.get("severity"),
                    "risk_score": email_data.get("overall_score", 0)
                },
                risk_score=email_data.get("overall_score", 0) / 100,
                first_seen=datetime.utcnow().isoformat() + "Z",
                last_seen=datetime.utcnow().isoformat() + "Z",
                confidence=email_data.get("confidence", 0) / 100
            )
        return node_id
    
    def add_domain_node(self, domain: str, properties: Dict = None) -> str:
        """Add domain node"""
        node_id = self._generate_node_id("domain", domain)
        
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(
                id=node_id,
                type="domain",
                label=f"Domain: {domain}",
                properties={
                    "domain": domain,
                    "registrar": properties.get("registrar") if properties else None,
                    "creation_date": properties.get("creation_date") if properties else None,
                    "is_lookalike": properties.get("is_lookalike", False) if properties else False,
                    "target_brand": properties.get("target_brand") if properties else None
                },
                risk_score=0.5,
                first_seen=datetime.utcnow().isoformat() + "Z",
                last_seen=datetime.utcnow().isoformat() + "Z",
                confidence=0.7
            )
        elif properties:
            # Update properties
            self.nodes[node_id].properties.update(properties)
            self.nodes[node_id].last_seen = datetime.utcnow().isoformat() + "Z"
        return node_id
    
    def add_ip_node(self, ip: str, properties: Dict = None) -> str:
        """Add IP node"""
        node_id = self._generate_node_id("ip", ip)
        
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(
                id=node_id,
                type="ip",
                label=f"IP: {ip}",
                properties={
                    "ip": ip,
                    "asn": properties.get("asn") if properties else None,
                    "org": properties.get("org") if properties else None,
                    "country": properties.get("country") if properties else None,
                    "is_datacenter": properties.get("is_datacenter", False) if properties else False,
                    "is_tor": properties.get("is_tor", False) if properties else False,
                    "is_vpn": properties.get("is_vpn", False) if properties else False
                },
                risk_score=0.6 if properties and properties.get("is_datacenter") else 0.3,
                first_seen=datetime.utcnow().isoformat() + "Z",
                last_seen=datetime.utcnow().isoformat() + "Z",
                confidence=0.8
            )
        return node_id
    
    def add_url_node(self, url: str, properties: Dict = None) -> str:
        """Add URL node"""
        node_id = self._generate_node_id("url", url)
        
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(
                id=node_id,
                type="url",
                label=f"URL: {url[:60]}",
                properties={
                    "url": url,
                    "domain": properties.get("domain") if properties else None,
                    "verdict": properties.get("verdict") if properties else None,
                    "risk_score": properties.get("risk_score", 0) if properties else 0,
                    "is_phishing": properties.get("verdict") == "MALICIOUS" if properties else False
                },
                risk_score=properties.get("risk_score", 0) / 100 if properties else 0,
                first_seen=datetime.utcnow().isoformat() + "Z",
                last_seen=datetime.utcnow().isoformat() + "Z",
                confidence=0.7
            )
        return node_id
    
    def add_attachment_node(self, attachment: Dict) -> str:
        """Add attachment node"""
        sha256 = attachment.get("sha256", "")
        node_id = self._generate_node_id("attachment", sha256)
        
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(
                id=node_id,
                type="attachment",
                label=f"Attachment: {attachment.get('filename', 'unknown')}",
                properties={
                    "filename": attachment.get("filename"),
                    "sha256": sha256,
                    "md5": attachment.get("md5"),
                    "size": attachment.get("size_bytes"),
                    "extension": attachment.get("extension"),
                    "verdict": attachment.get("verdict"),
                    "risk_score": attachment.get("risk_score", 0)
                },
                risk_score=attachment.get("risk_score", 0) / 100,
                first_seen=datetime.utcnow().isoformat() + "Z",
                last_seen=datetime.utcnow().isoformat() + "Z",
                confidence=0.9
            )
        return node_id
    
    def add_edge(self, source: str, target: str, relationship: str, 
                 weight: float = 1.0, evidence: List[str] = None) -> GraphEdge:
        """Add edge between nodes"""
        edge = GraphEdge(
            source=source,
            target=target,
            relationship=relationship,
            weight=weight,
            evidence=evidence or [],
            first_observed=datetime.utcnow().isoformat() + "Z",
            last_observed=datetime.utcnow().isoformat() + "Z"
        )
        self.edges.append(edge)
        return edge
    
    def correlate_email(self, email_data: Dict, header_data: Dict, 
                       geo_data: Dict, url_data: Dict, attachment_data: Dict) -> str:
        """Build full correlation graph for an email"""
        email_node = self.add_email_node(email_data)
        
        # Sender domain
        from_domain = header_data.get("identity", {}).get("from_domain")
        if from_domain:
            domain_node = self.add_domain_node(from_domain)
            self.add_edge(email_node, domain_node, "sent_from", 0.9, ["header_from"])
        
        # Reply-To domain
        reply_domain = header_data.get("identity", {}).get("reply_domain")
        if reply_domain and reply_domain != from_domain:
            reply_node = self.add_domain_node(reply_domain, {"is_reply_to": True})
            self.add_edge(email_node, reply_node, "reply_to", 0.8, ["header_reply_to"])
        
        # Origin IP
        origin_ip = geo_data.get("ip")
        if origin_ip and origin_ip != "127.0.0.1":
            ip_node = self.add_ip_node(origin_ip, {
                "asn": geo_data.get("asn"),
                "org": geo_data.get("org"),
                "country": geo_data.get("country"),
                "is_datacenter": geo_data.get("network_type", {}).get("is_datacenter", False),
                "is_tor": geo_data.get("threat_intel", {}).get("is_tor", False),
                "is_vpn": geo_data.get("threat_intel", {}).get("is_vpn", False)
            })
            self.add_edge(email_node, ip_node, "originates_from", 0.95, ["received_headers", "geoip"])
            
            # IP -> ASN relationship
            if geo_data.get("asn"):
                asn_node = self.add_domain_node(f"ASN:{geo_data['asn']}", {"type": "asn"})
                self.add_edge(ip_node, asn_node, "belongs_to_asn", 1.0, ["asn_lookup"])
        
        # URLs
        for url_info in url_data.get("urls", []):
            url_node = self.add_url_node(url_info.get("raw_url", ""), {
                "domain": url_info.get("domain"),
                "verdict": url_info.get("verdict"),
                "risk_score": url_info.get("risk_score", 0)
            })
            self.add_edge(email_node, url_node, "contains_url", 0.8, ["body_analysis"])
            
            # URL -> Domain
            if url_info.get("domain"):
                url_domain_node = self.add_domain_node(url_info["domain"])
                self.add_edge(url_node, url_domain_node, "resolves_to", 1.0, ["dns"])
        
        # Attachments
        for att in attachment_data.get("items", []):
            att_node = self.add_attachment_node(att)
            self.add_edge(email_node, att_node, "has_attachment", 1.0, ["mime_analysis"])
        
        # Authentication results
        auth_results = header_data.get("auth", {})
        if auth_results.get("dmarc_aligned") is False:
            # Create threat indicator node
            threat_node = self._generate_node_id("threat_indicator", "dmarc_misalignment")
            if threat_node not in self.nodes:
                self.nodes[threat_node] = GraphNode(
                    id=threat_node,
                    type="threat_indicator",
                    label="DMARC Misalignment",
                    properties={"indicator": "DMARC_MISALIGNMENT"},
                    risk_score=0.7,
                    first_seen=datetime.utcnow().isoformat() + "Z",
                    last_seen=datetime.utcnow().isoformat() + "Z",
                    confidence=0.9
                )
            self.add_edge(email_node, threat_node, "indicates", 0.7, ["dmarc_check"])
        
        return email_node
    
    def detect_campaigns(self, min_similarity: float = 0.7) -> List[Dict]:
        """Detect campaign clusters using graph clustering"""
        campaigns = []
        visited = set()
        
        for node_id, node in self.nodes.items():
            if node.type != "email" or node_id in visited:
                continue
            
            # Find connected emails through shared infrastructure
            cluster = self._find_campaign_cluster(node_id)
            if len(cluster) > 1:
                campaign_id = f"CAMP-{hashlib.sha256(str(sorted(cluster)).encode()).hexdigest()[:8]}"
                campaigns.append({
                    "campaign_id": campaign_id,
                    "emails": cluster,
                    "size": len(cluster),
                    "shared_infrastructure": self._get_shared_infrastructure(cluster),
                    "confidence": self._calculate_campaign_confidence(cluster)
                })
                visited.update(cluster)
        
        return campaigns
    
    def _find_campaign_cluster(self, email_node_id: str) -> List[str]:
        """Find emails sharing infrastructure"""
        cluster = {email_node_id}
        email_node = self.nodes[email_node_id]
        
        # Get connected infrastructure
        infra_nodes = set()
        for edge in self.edges:
            if edge.source == email_node_id and edge.target in self.nodes:
                if self.nodes[edge.target].type in ["domain", "ip", "url", "attachment"]:
                    infra_nodes.add(edge.target)
            elif edge.target == email_node_id and edge.source in self.nodes:
                if self.nodes[edge.source].type in ["domain", "ip", "url", "attachment"]:
                    infra_nodes.add(edge.source)
        
        # Find other emails connected to same infrastructure
        for infra_id in infra_nodes:
            for edge in self.edges:
                other_email = None
                if edge.source == infra_id and edge.target != email_node_id:
                    if self.nodes.get(edge.target, {}).type == "email":
                        other_email = edge.target
                elif edge.target == infra_id and edge.source != email_node_id:
                    if self.nodes.get(edge.source, {}).type == "email":
                        other_email = edge.source
                
                if other_email:
                    cluster.add(other_email)
        
        return list(cluster)
    
    def _get_shared_infrastructure(self, email_ids: List[str]) -> Dict[str, List[str]]:
        """Get infrastructure shared by campaign emails"""
        shared = defaultdict(list)
        infra_counts = defaultdict(int)
        
        for eid in email_ids:
            for edge in self.edges:
                if edge.source == eid and self.nodes.get(edge.target, {}).type in ["domain", "ip", "url"]:
                    infra_counts[edge.target] += 1
                elif edge.target == eid and self.nodes.get(edge.source, {}).type in ["domain", "ip", "url"]:
                    infra_counts[edge.source] += 1
        
        for infra_id, count in infra_counts.items():
            if count > 1:
                node = self.nodes[infra_id]
                shared[node.type].append({
                    "id": infra_id,
                    "label": node.label,
                    "shared_by": count
                })
        
        return dict(shared)
    
    def _calculate_campaign_confidence(self, email_ids: List[str]) -> float:
        """Calculate confidence score for campaign"""
        if len(email_ids) < 2:
            return 0.0
        
        total_shared = 0
        total_possible = 0
        
        for i, eid1 in enumerate(email_ids):
            for eid2 in email_ids[i+1:]:
                shared = 0
                possible = 0
                
                infra1 = set()
                infra2 = set()
                
                for edge in self.edges:
                    if edge.source == eid1 and self.nodes.get(edge.target, {}).type in ["domain", "ip", "url"]:
                        infra1.add(edge.target)
                    if edge.source == eid2 and self.nodes.get(edge.target, {}).type in ["domain", "ip", "url"]:
                        infra2.add(edge.target)
                
                shared = len(infra1 & infra2)
                possible = len(infra1 | infra2)
                
                if possible > 0:
                    total_shared += shared
                    total_possible += possible
        
        return total_shared / total_possible if total_possible > 0 else 0.0
    
    def get_subgraph(self, center_node_id: str, depth: int = 2) -> Dict[str, Any]:
        """Get subgraph around a node for visualization"""
        if center_node_id not in self.nodes:
            return {"nodes": [], "edges": []}
        
        visited = {center_node_id}
        frontier = {center_node_id}
        
        for _ in range(depth):
            new_frontier = set()
            for node_id in frontier:
                for edge in self.edges:
                    if edge.source == node_id and edge.target not in visited:
                        new_frontier.add(edge.target)
                        visited.add(edge.target)
                    elif edge.target == node_id and edge.source not in visited:
                        new_frontier.add(edge.source)
                        visited.add(edge.source)
            frontier = new_frontier
        
        subgraph_nodes = {nid: self.nodes[nid] for nid in visited}
        subgraph_edges = [e for e in self.edges if e.source in visited and e.target in visited]
        
        return {
            "nodes": [asdict(n) for n in subgraph_nodes.values()],
            "edges": [asdict(e) for e in subgraph_edges]
        }
    
    def export_graph(self) -> Dict[str, Any]:
        """Export full graph"""
        return {
            "nodes": [asdict(n) for n in self.nodes.values()],
            "edges": [asdict(e) for e in self.edges],
            "campaigns": self.campaigns,
            "stats": {
                "total_nodes": len(self.nodes),
                "total_edges": len(self.edges),
                "node_types": self._count_node_types()
            }
        }
    
    def _count_node_types(self) -> Dict[str, int]:
        counts = defaultdict(int)
        for node in self.nodes.values():
            counts[node.type] += 1
        return dict(counts)


# Global graph instance
_graph = ThreatCorrelationGraph()

def get_graph() -> ThreatCorrelationGraph:
    return _graph


def build_correlation_graph(email_data: Dict, header_data: Dict, 
                           geo_data: Dict, url_data: Dict, attachment_data: Dict) -> str:
    """Build correlation graph for email"""
    return _graph.correlate_email(email_data, header_data, geo_data, url_data, attachment_data)


def get_campaigns() -> List[Dict]:
    """Get detected campaigns"""
    return _graph.detect_campaigns()


def get_email_subgraph(email_node_id: str, depth: int = 2) -> Dict[str, Any]:
    """Get subgraph for email visualization"""
    return _graph.get_subgraph(email_node_id, depth)


def export_full_graph() -> Dict[str, Any]:
    """Export full threat graph"""
    return _graph.export_graph()