"""
JASPER API Cost Monitor
Tracks all AI API calls with token counts and costs
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger

# Cost per million tokens (DeepSeek V3.2 - Dec 2025)
DEEPSEEK_PRICING = {
    "deepseek-chat": {
        "input_cache_hit": 0.028,
        "input_cache_miss": 0.28,
        "output": 0.42
    },
    "deepseek-reasoner": {
        "input_cache_hit": 0.028,
        "input_cache_miss": 0.28,
        "output": 0.42
    }
}

LOG_FILE = Path("/opt/jasper-crm/data/api_usage_log.json")

class APIMonitor:
    """Singleton monitor for tracking API costs"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.session_calls = []
        self.session_start = datetime.utcnow()
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    def log_deepseek_call(
        self,
        model: str,
        endpoint: str,
        input_tokens: int,
        output_tokens: int,
        cached_tokens: int = 0,
        caller: str = "unknown",
        prompt_preview: str = ""
    ) -> Dict[str, Any]:
        """Log a DeepSeek API call with cost calculation"""
        
        pricing = DEEPSEEK_PRICING.get(model, DEEPSEEK_PRICING["deepseek-chat"])
        
        # Calculate costs
        cache_miss_tokens = input_tokens - cached_tokens
        input_cost = (
            (cached_tokens / 1_000_000) * pricing["input_cache_hit"] +
            (cache_miss_tokens / 1_000_000) * pricing["input_cache_miss"]
        )
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        total_cost = input_cost + output_cost
        
        call_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "model": model,
            "endpoint": endpoint,
            "caller": caller,
            "tokens": {
                "input": input_tokens,
                "output": output_tokens,
                "cached": cached_tokens,
                "total": input_tokens + output_tokens
            },
            "cost": {
                "input": round(input_cost, 6),
                "output": round(output_cost, 6),
                "total": round(total_cost, 6)
            },
            "prompt_preview": prompt_preview[:200] + "..." if len(prompt_preview) > 200 else prompt_preview
        }
        
        self.session_calls.append(call_record)
        
        # Log to console
        logger.info(
            f"[API Monitor] {model} | "
            f"In: {input_tokens} (cached: {cached_tokens}) | "
            f"Out: {output_tokens} | "
            f"Cost: ${total_cost:.6f} | "
            f"Caller: {caller}"
        )
        
        # Append to file
        self._append_to_log(call_record)
        
        return call_record
    
    def _append_to_log(self, record: Dict[str, Any]):
        """Append a record to the JSON log file"""
        try:
            if LOG_FILE.exists():
                with open(LOG_FILE, "r") as f:
                    data = json.load(f)
            else:
                data = {"calls": [], "daily_totals": {}}
            
            data["calls"].append(record)
            
            # Update daily totals
            today = datetime.utcnow().strftime("%Y-%m-%d")
            if today not in data["daily_totals"]:
                data["daily_totals"][today] = {"calls": 0, "tokens": 0, "cost": 0}
            
            data["daily_totals"][today]["calls"] += 1
            data["daily_totals"][today]["tokens"] += record["tokens"]["total"]
            data["daily_totals"][today]["cost"] += record["cost"]["total"]
            
            with open(LOG_FILE, "w") as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"[API Monitor] Failed to write log: {e}")
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary of current session"""
        total_tokens = sum(c["tokens"]["total"] for c in self.session_calls)
        total_cost = sum(c["cost"]["total"] for c in self.session_calls)
        
        return {
            "session_start": self.session_start.isoformat(),
            "total_calls": len(self.session_calls),
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
            "calls": self.session_calls
        }
    
    def get_today_summary(self) -> Dict[str, Any]:
        """Get today usage summary from log file"""
        try:
            if not LOG_FILE.exists():
                return {"calls": 0, "tokens": 0, "cost": 0}
            
            with open(LOG_FILE, "r") as f:
                data = json.load(f)
            
            today = datetime.utcnow().strftime("%Y-%m-%d")
            return data["daily_totals"].get(today, {"calls": 0, "tokens": 0, "cost": 0})
        except:
            return {"calls": 0, "tokens": 0, "cost": 0}


# Global instance
api_monitor = APIMonitor()
