"""JASPER CRM - Alerting Service with Discord Support"""

import os
import httpx
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertingService:
    def __init__(self):
        self.discord_webhook = os.getenv("DISCORD_WEBHOOK_URL")
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        self.alert_history: List[Dict[str, Any]] = []
        self.max_history = 100
        self._rate_limit: Dict[str, datetime] = {}
        self._rate_limit_seconds = 60
    
    def _get_configured_channels(self) -> List[str]:
        """Get list of configured alert channels."""
        channels = ["log"]
        if self.discord_webhook:
            channels.append("discord")
        if self.slack_webhook:
            channels.append("slack")
        return channels
    
    def _is_rate_limited(self, key: str) -> bool:
        """Check if alert is rate limited."""
        if key in self._rate_limit:
            elapsed = (datetime.now() - self._rate_limit[key]).total_seconds()
            if elapsed < self._rate_limit_seconds:
                return True
        self._rate_limit[key] = datetime.now()
        return False
    
    async def send_alert(
        self,
        level: AlertLevel,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send alert to all configured channels."""
        
        rate_key = f"{level}:{title}"
        if self._is_rate_limited(rate_key):
            return {"success": False, "reason": "rate_limited"}
        
        alert = {
            "id": f"alert-{datetime.now().strftime("%Y%m%d%H%M%S%f")}",
            "level": level.value if isinstance(level, AlertLevel) else level,
            "title": title,
            "message": message,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
            "channels_sent": []
        }
        
        # Always log
        log_method = getattr(logger, level.value if isinstance(level, AlertLevel) else level, logger.info)
        log_method(f"ALERT [{alert["level"].upper()}] {title}: {message}")
        alert["channels_sent"].append("log")
        
        # Send to Discord
        if self.discord_webhook:
            try:
                await self._send_discord(alert)
                alert["channels_sent"].append("discord")
            except Exception as e:
                logger.error(f"Discord alert failed: {e}")
        
        # Send to Slack
        if self.slack_webhook:
            try:
                await self._send_slack(alert)
                alert["channels_sent"].append("slack")
            except Exception as e:
                logger.error(f"Slack alert failed: {e}")
        
        # Store in history
        self.alert_history.append(alert)
        if len(self.alert_history) > self.max_history:
            self.alert_history = self.alert_history[-self.max_history:]
        
        return {"success": True, "alert": alert}
    
    async def _send_discord(self, alert: Dict[str, Any]):
        """Send alert to Discord webhook."""
        level = alert["level"]
        emoji = {"info": "ℹ️", "warning": "⚠️", "error": "❌", "critical": "🚨"}.get(level, "📢")
        
        payload = {
            "embeds": [{
                "title": f"{emoji} {alert["title"]}",
                "description": alert["message"],
                "color": {"info": 3447003, "warning": 16776960, "error": 15158332, "critical": 10038562}.get(level, 3447003),
                "timestamp": alert["timestamp"],
                "footer": {"text": "JASPER CRM Alerts"}
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.discord_webhook, json=payload, timeout=10)
            if response.status_code not in (200, 204):
                raise Exception(f"Discord returned {response.status_code}")
    
    async def _send_slack(self, alert: Dict[str, Any]):
        """Send alert to Slack webhook."""
        level = alert["level"]
        emoji = {"info": ":information_source:", "warning": ":warning:", "error": ":x:", "critical": ":rotating_light:"}.get(level, ":bell:")
        
        payload = {
            "text": f"{emoji} *{alert["title"]}*\n{alert["message"]}",
            "attachments": [{
                "color": {"info": "#3498db", "warning": "#f1c40f", "error": "#e74c3c", "critical": "#8e44ad"}.get(level, "#3498db"),
                "footer": "JASPER CRM Alerts",
                "ts": datetime.now().timestamp()
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.slack_webhook, json=payload, timeout=10)
            if response.status_code != 200:
                raise Exception(f"Slack returned {response.status_code}")
    
    def get_recent_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent alerts from history."""
        return list(reversed(self.alert_history[-limit:]))
    
    async def test_channels(self) -> Dict[str, Any]:
        """Test all configured channels."""
        results = {}
        
        if self.discord_webhook:
            try:
                test_alert = {
                    "level": "info",
                    "title": "Channel Test",
                    "message": "Discord alerts are working!",
                    "timestamp": datetime.now().isoformat()
                }
                await self._send_discord(test_alert)
                results["discord"] = "success"
            except Exception as e:
                results["discord"] = f"failed: {e}"
        else:
            results["discord"] = "not configured"
        
        if self.slack_webhook:
            try:
                test_alert = {
                    "level": "info",
                    "title": "Channel Test",
                    "message": "Slack alerts are working!",
                    "timestamp": datetime.now().isoformat()
                }
                await self._send_slack(test_alert)
                results["slack"] = "success"
            except Exception as e:
                results["slack"] = f"failed: {e}"
        else:
            results["slack"] = "not configured"
        
        return {"channels": self._get_configured_channels(), "test_results": results}


# Singleton instance
alerting_service = AlertingService()
