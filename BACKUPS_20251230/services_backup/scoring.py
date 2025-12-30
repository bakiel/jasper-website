"""
JASPER Lead Intelligence System - Lead Scoring Service
Calculates 0-100 score and tier classification for leads.

Scoring Breakdown (max 155 points, capped at 100):
- Contact Info: +15
- Engagement: +40
- Qualification (BANT): +40
- Deal Size: +20
- Similar Deals: +15
- Call Scheduled: +25

Tiers:
- 🔥 Hot (70+): Immediate follow-up
- 🌡️ Warm (40-69): Nurture sequence
- ❄️ Cold (<40): Automated only
"""

from typing import List, Optional, Tuple, TYPE_CHECKING
from datetime import datetime, timedelta
import logging

from models.lead import Lead, LeadTier, SimilarDeal

logger = logging.getLogger(__name__)


# ============================================================================
# SCORING WEIGHTS
# ============================================================================

WEIGHTS = {
    # Contact Info (+15 max)
    "phone": 10,
    "linkedin": 5,

    # Engagement (+40 max)
    "responded": 20,
    "emails_opened_2plus": 10,
    "asked_pricing": 10,

    # Qualification BANT (+40 max)
    "is_decision_maker": 15,
    "mentioned_budget": 15,
    "mentioned_timeline": 10,

    # Deal Size (+20 max)
    "deal_size_large": 20,  # > R10M
    "deal_size_medium": 10,  # > R5M

    # Similar Deals (+15 max)
    "similar_high": 15,  # avg similarity > 0.8
    "similar_medium": 10,  # avg similarity > 0.6

    # Call Scheduled (+25)
    "call_scheduled": 25,

    # Bonus Points
    "requested_proposal": 15,
    "requested_call": 10,
    "recent_activity": 5,  # Activity in last 7 days
}

TIER_THRESHOLDS = {
    "hot": 70,
    "warm": 40,
    "cold": 0,
}


# ============================================================================
# SCORING FUNCTION
# ============================================================================

def calculate_lead_score(
    lead: Lead,
    similar_deals: Optional[List[SimilarDeal]] = None
) -> Tuple[int, LeadTier, dict]:
    """
    Calculate lead score from 0-100 with tier classification.

    Args:
        lead: The Lead File to score
        similar_deals: Similar won deals from ALEPH (optional)

    Returns:
        Tuple of (score, tier, breakdown)
        - score: 0-100 integer
        - tier: LeadTier enum (HOT, WARM, COLD)
        - breakdown: dict explaining score components
    """
    score = 0
    breakdown = {}

    # --- Contact Info (+15 max) ---
    contact_score = 0
    if lead.phone:
        contact_score += WEIGHTS["phone"]
        breakdown["phone"] = f"+{WEIGHTS['phone']} (phone provided)"
    if lead.linkedin:
        contact_score += WEIGHTS["linkedin"]
        breakdown["linkedin"] = f"+{WEIGHTS['linkedin']} (LinkedIn profile)"
    score += contact_score

    # --- Engagement (+40 max) ---
    engagement_score = 0
    if lead.responded:
        engagement_score += WEIGHTS["responded"]
        breakdown["responded"] = f"+{WEIGHTS['responded']} (responded to outreach)"
    if lead.emails_opened >= 2:
        engagement_score += WEIGHTS["emails_opened_2plus"]
        breakdown["emails_opened"] = f"+{WEIGHTS['emails_opened_2plus']} ({lead.emails_opened} emails opened)"
    if lead.asked_about_pricing:
        engagement_score += WEIGHTS["asked_pricing"]
        breakdown["asked_pricing"] = f"+{WEIGHTS['asked_pricing']} (asked about pricing)"
    score += engagement_score

    # --- Qualification BANT (+40 max) ---
    bant_score = 0
    if lead.bant.authority_qualified:
        bant_score += WEIGHTS["is_decision_maker"]
        breakdown["decision_maker"] = f"+{WEIGHTS['is_decision_maker']} (decision maker confirmed)"
    if lead.bant.budget_qualified or lead.deal_size:
        bant_score += WEIGHTS["mentioned_budget"]
        breakdown["budget"] = f"+{WEIGHTS['mentioned_budget']} (budget discussed)"
    if lead.bant.timeline_qualified:
        bant_score += WEIGHTS["mentioned_timeline"]
        breakdown["timeline"] = f"+{WEIGHTS['mentioned_timeline']} (timeline discussed)"
    score += bant_score

    # --- Deal Size (+20 max) ---
    deal_score = 0
    if lead.deal_size:
        if lead.deal_size > 10_000_000:  # R10M+
            deal_score = WEIGHTS["deal_size_large"]
            breakdown["deal_size"] = f"+{WEIGHTS['deal_size_large']} (R{lead.deal_size:,.0f} - large deal)"
        elif lead.deal_size > 5_000_000:  # R5M+
            deal_score = WEIGHTS["deal_size_medium"]
            breakdown["deal_size"] = f"+{WEIGHTS['deal_size_medium']} (R{lead.deal_size:,.0f} - medium deal)"
    score += deal_score

    # --- Similar Deals (+15 max) ---
    similar_score = 0
    if similar_deals:
        avg_similarity = sum(d.similarity_score for d in similar_deals) / len(similar_deals)
        if avg_similarity > 0.8:
            similar_score = WEIGHTS["similar_high"]
            breakdown["similar_deals"] = f"+{WEIGHTS['similar_high']} (highly similar to won deals, avg={avg_similarity:.2f})"
        elif avg_similarity > 0.6:
            similar_score = WEIGHTS["similar_medium"]
            breakdown["similar_deals"] = f"+{WEIGHTS['similar_medium']} (similar to won deals, avg={avg_similarity:.2f})"
    elif lead.similar_deals:
        # Use cached similar deals from Lead File
        avg_similarity = sum(d.similarity_score for d in lead.similar_deals) / len(lead.similar_deals)
        if avg_similarity > 0.8:
            similar_score = WEIGHTS["similar_high"]
            breakdown["similar_deals"] = f"+{WEIGHTS['similar_high']} (highly similar to won deals)"
        elif avg_similarity > 0.6:
            similar_score = WEIGHTS["similar_medium"]
            breakdown["similar_deals"] = f"+{WEIGHTS['similar_medium']} (similar to won deals)"
    score += similar_score

    # --- Call Scheduled (+25) ---
    if lead.has_call_scheduled:
        score += WEIGHTS["call_scheduled"]
        breakdown["call_scheduled"] = f"+{WEIGHTS['call_scheduled']} (call scheduled)"

    # --- Bonus Points ---
    # Check for optional bonus attributes
    if getattr(lead, 'requested_proposal', False):
        score += WEIGHTS["requested_proposal"]
        breakdown["requested_proposal"] = f"+{WEIGHTS['requested_proposal']} (requested proposal)"
    if getattr(lead, 'requested_call', False):
        score += WEIGHTS["requested_call"]
        breakdown["requested_call"] = f"+{WEIGHTS['requested_call']} (requested call)"

    # Recent activity bonus
    if lead.last_contacted_at:
        days_since_contact = (datetime.utcnow() - lead.last_contacted_at).days
        if days_since_contact <= 7:
            score += WEIGHTS["recent_activity"]
            breakdown["recent_activity"] = f"+{WEIGHTS['recent_activity']} (active in last 7 days)"

    # --- Cap at 100 ---
    final_score = min(score, 100)

    # --- Determine Tier ---
    if final_score >= TIER_THRESHOLDS["hot"]:
        tier = LeadTier.HOT
    elif final_score >= TIER_THRESHOLDS["warm"]:
        tier = LeadTier.WARM
    else:
        tier = LeadTier.COLD

    # Add summary to breakdown
    breakdown["_total"] = final_score
    breakdown["_tier"] = tier.value
    breakdown["_raw_score"] = score

    logger.info(f"Lead {lead.id} scored: {final_score} ({tier.value})")

    return final_score, tier, breakdown


# ============================================================================
# SCORING SERVICE CLASS
# ============================================================================

class LeadScoringService:
    """
    Service class for lead scoring operations.

    Usage:
        service = LeadScoringService()
        lead = service.score_lead(lead_file)
        # lead.score and lead.tier are now updated
    """

    def __init__(self, aleph_client=None):
        """
        Initialize scoring service.

        Args:
            aleph_client: Optional ALEPH client for similar deal lookup
        """
        self.aleph = aleph_client

    async def score_lead(self, lead: Lead) -> Lead:
        """
        Score a lead and update the Lead File.

        Args:
            lead: The Lead to score

        Returns:
            Updated Lead with score and tier
        """
        # Get similar deals from ALEPH if available
        similar_deals = None
        if self.aleph and not lead.similar_deals:
            try:
                similar_deals = await self.aleph.find_similar_leads(lead)
            except Exception as e:
                logger.warning(f"Failed to get similar deals: {e}")

        # Calculate score
        score, tier, breakdown = calculate_lead_score(lead, similar_deals)

        # Update lead
        lead.score = score
        lead.tier = tier
        lead.updated_at = datetime.utcnow()

        # Cache similar deals if found
        if similar_deals:
            lead.similar_deals = similar_deals

        return lead

    async def bulk_score(self, leads: List[Lead]) -> List[Lead]:
        """
        Score multiple leads.

        Args:
            leads: List of Leads to score

        Returns:
            List of updated Leads
        """
        scored = []
        for lead in leads:
            try:
                scored_lead = await self.score_lead(lead)
                scored.append(scored_lead)
            except Exception as e:
                logger.error(f"Failed to score lead {lead.id}: {e}")
                scored.append(lead)
        return scored

    def get_tier_distribution(self, leads: List[Lead]) -> dict:
        """
        Get tier distribution for a list of leads.

        Returns:
            {
                "hot": {"count": 5, "percentage": 10},
                "warm": {"count": 20, "percentage": 40},
                "cold": {"count": 25, "percentage": 50}
            }
        """
        total = len(leads)
        if total == 0:
            return {
                "hot": {"count": 0, "percentage": 0},
                "warm": {"count": 0, "percentage": 0},
                "cold": {"count": 0, "percentage": 0},
            }

        hot = sum(1 for l in leads if l.tier == LeadTier.HOT)
        warm = sum(1 for l in leads if l.tier == LeadTier.WARM)
        cold = sum(1 for l in leads if l.tier == LeadTier.COLD)

        return {
            "hot": {"count": hot, "percentage": round(hot / total * 100)},
            "warm": {"count": warm, "percentage": round(warm / total * 100)},
            "cold": {"count": cold, "percentage": round(cold / total * 100)},
        }

    def needs_attention(self, lead: Lead) -> bool:
        """
        Check if lead needs immediate attention.

        Criteria:
        - Hot lead with no recent contact
        - Warm lead with call scheduled today
        - Any lead that escalated
        """
        if getattr(lead, 'escalated', False):
            return True

        if lead.tier == LeadTier.HOT:
            if not lead.last_contacted_at:
                return True
            days_since = (datetime.utcnow() - lead.last_contacted_at).days
            if days_since >= 2:
                return True

        if lead.has_call_scheduled and lead.next_call_at:
            hours_until = (lead.next_call_at - datetime.utcnow()).total_seconds() / 3600
            if 0 < hours_until < 24:
                return True

        return False
