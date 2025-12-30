"""
Enhancement Orchestrator
========================
Autonomous content enhancement system that runs without intervention.

Features:
- Queues enhancements when articles are published
- Processes one article at a time (queue-based)
- Coordinates: citations, internal links, A/B titles
- Self-verifying with quality checks
- Anti-waste via task tracker

Architecture:
  APScheduler → EnhancementOrchestrator → Individual Services
                      ↓
              TaskTrackerService (anti-waste)
                      ↓
              QualityVerifier (self-check)
"""

import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Any
from enum import Enum
import logging

from services.task_tracker_service import task_tracker, TaskType, TaskStatus
from services.ai_router import AIRouter, AITask

# Configure logging
logger = logging.getLogger(__name__)

# Data storage
DATA_DIR = Path("/opt/jasper-crm/data")
ORCHESTRATOR_STATE_FILE = DATA_DIR / "orchestrator_state.json"


class EnhancementResult:
    """Container for enhancement operation results."""
    def __init__(self, success: bool, details: dict = None, error: str = None):
        self.success = success
        self.details = details or {}
        self.error = error

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "details": self.details,
            "error": self.error
        }


class EnhancementOrchestrator:
    """
    Autonomous content enhancement orchestrator.

    Runs enhancements one at a time, tracks state, verifies quality.
    """

    def __init__(self):
        self.ai_router = AIRouter()
        self._ensure_state_file()
        self._is_running = False

    def _ensure_state_file(self):
        """Create state file if it doesn't exist."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not ORCHESTRATOR_STATE_FILE.exists():
            self._save_state({
                "last_run": None,
                "articles_processed": 0,
                "current_task": None,
                "errors_today": 0,
                "last_error": None
            })

    def _load_state(self) -> dict:
        """Load orchestrator state."""
        try:
            with open(ORCHESTRATOR_STATE_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {
                "last_run": None,
                "articles_processed": 0,
                "current_task": None,
                "errors_today": 0,
                "last_error": None
            }

    def _save_state(self, state: dict):
        """Save orchestrator state."""
        with open(ORCHESTRATOR_STATE_FILE, "w") as f:
            json.dump(state, f, indent=2, default=str)

    # -------------------------------------------------------------------------
    # ARTICLE ENHANCEMENT QUEUE
    # -------------------------------------------------------------------------

    async def queue_article_enhancement(
        self,
        article_slug: str,
        triggered_by: str = "auto"
    ) -> Dict[str, Optional[str]]:
        """
        Queue all enhancement tasks for an article.

        Anti-waste: Only queues tasks that haven't been done recently.
        Returns dict of task_type -> task_id (None if skipped).
        """
        queued = {}

        for task_type in [TaskType.CITATIONS, TaskType.INTERNAL_LINKS, TaskType.AB_TITLES]:
            task_id = task_tracker.create_task(
                article_slug=article_slug,
                task_type=task_type,
                triggered_by=triggered_by
            )
            queued[task_type.value] = task_id

            if task_id:
                logger.info(f"Queued {task_type.value} for {article_slug}: {task_id}")
            else:
                logger.debug(f"Skipped {task_type.value} for {article_slug} (anti-waste)")

        return queued

    async def queue_full_enhancement(
        self,
        article_slug: str,
        triggered_by: str = "auto"
    ) -> Optional[str]:
        """Queue a full enhancement task (all-in-one)."""
        task_id = task_tracker.create_task(
            article_slug=article_slug,
            task_type=TaskType.FULL_ENHANCEMENT,
            triggered_by=triggered_by
        )

        if task_id:
            logger.info(f"Queued full enhancement for {article_slug}: {task_id}")

        return task_id

    # -------------------------------------------------------------------------
    # TASK PROCESSING
    # -------------------------------------------------------------------------

    async def process_pending_tasks(self, max_tasks: int = 5) -> Dict[str, Any]:
        """
        Process pending enhancement tasks.

        Called by scheduler or manually. Processes one at a time
        to avoid overwhelming the AI services.
        """
        if self._is_running:
            return {"status": "already_running", "processed": 0}

        self._is_running = True
        state = self._load_state()
        results = {
            "status": "completed",
            "processed": 0,
            "succeeded": 0,
            "failed": 0,
            "tasks": []
        }

        try:
            pending = task_tracker.get_pending_tasks()[:max_tasks]

            for task in pending:
                task_id = task["task_id"]
                task_type = task["task_type"]
                article_slug = task["article_slug"]

                logger.info(f"Processing task: {task_id}")
                state["current_task"] = task_id
                self._save_state(state)

                # Mark as running
                task_tracker.update_status(task_id, TaskStatus.RUNNING)

                # Execute the enhancement
                try:
                    result = await self._execute_enhancement(
                        article_slug=article_slug,
                        task_type=task_type
                    )

                    if result.success:
                        # Mark as verifying, then verify
                        task_tracker.update_status(
                            task_id,
                            TaskStatus.VERIFYING,
                            result=result.details
                        )

                        # Run verification
                        verification = await self._verify_enhancement(
                            article_slug=article_slug,
                            task_type=task_type,
                            result=result.details
                        )

                        task_tracker.set_verification(task_id, verification)

                        if verification.get("passed", False):
                            task_tracker.update_status(task_id, TaskStatus.COMPLETED)
                            results["succeeded"] += 1
                        else:
                            task_tracker.update_status(
                                task_id,
                                TaskStatus.FAILED,
                                error=f"Verification failed: {verification.get('issues', [])}"
                            )
                            results["failed"] += 1
                    else:
                        task_tracker.update_status(
                            task_id,
                            TaskStatus.FAILED,
                            error=result.error
                        )
                        results["failed"] += 1
                        state["last_error"] = result.error
                        state["errors_today"] += 1

                except Exception as e:
                    logger.error(f"Task {task_id} failed: {e}")
                    task_tracker.update_status(
                        task_id,
                        TaskStatus.FAILED,
                        error=str(e)
                    )
                    results["failed"] += 1
                    state["last_error"] = str(e)
                    state["errors_today"] += 1

                results["processed"] += 1
                results["tasks"].append({
                    "task_id": task_id,
                    "status": "completed" if result.success else "failed"
                })

                state["articles_processed"] += 1

                # Small delay between tasks to be nice to APIs
                await asyncio.sleep(2)

            state["last_run"] = datetime.now().isoformat()
            state["current_task"] = None
            self._save_state(state)

        finally:
            self._is_running = False

        return results

    # -------------------------------------------------------------------------
    # ENHANCEMENT EXECUTION
    # -------------------------------------------------------------------------

    async def _execute_enhancement(
        self,
        article_slug: str,
        task_type: str
    ) -> EnhancementResult:
        """Execute a specific enhancement type."""

        try:
            if task_type == TaskType.CITATIONS.value:
                return await self._add_citations(article_slug)

            elif task_type == TaskType.INTERNAL_LINKS.value:
                return await self._add_internal_links(article_slug)

            elif task_type == TaskType.AB_TITLES.value:
                return await self._generate_ab_titles(article_slug)

            elif task_type == TaskType.FULL_ENHANCEMENT.value:
                # Run all enhancements
                results = {}

                citations = await self._add_citations(article_slug)
                results["citations"] = citations.to_dict()

                links = await self._add_internal_links(article_slug)
                results["internal_links"] = links.to_dict()

                titles = await self._generate_ab_titles(article_slug)
                results["ab_titles"] = titles.to_dict()

                # Overall success if at least 2/3 succeeded
                successes = sum(1 for r in [citations, links, titles] if r.success)
                overall_success = successes >= 2

                return EnhancementResult(
                    success=overall_success,
                    details=results,
                    error=None if overall_success else "Some enhancements failed"
                )

            else:
                return EnhancementResult(
                    success=False,
                    error=f"Unknown task type: {task_type}"
                )

        except Exception as e:
            logger.error(f"Enhancement execution failed: {e}")
            return EnhancementResult(success=False, error=str(e))

    async def _add_citations(self, article_slug: str) -> EnhancementResult:
        """Add citations to an article using citation service."""
        try:
            # Import citation service (uses getter pattern)
            from services.citation_service import get_citation_service
            citation_service = get_citation_service()

            # Analyze and add citations
            analysis = await citation_service.analyze_article(article_slug)

            if analysis.get("opportunities", 0) == 0:
                return EnhancementResult(
                    success=True,
                    details={"message": "No citation opportunities found", "added": 0}
                )

            result = await citation_service.add_citations(
                article_slug=article_slug,
                style="inline",
                max_citations=5
            )

            return EnhancementResult(
                success=True,
                details={
                    "citations_added": result.get("citations_added", 0),
                    "sources_used": result.get("sources_used", [])
                }
            )

        except ImportError:
            logger.warning("Citation service not available")
            return EnhancementResult(
                success=False,
                error="Citation service not available"
            )
        except Exception as e:
            return EnhancementResult(success=False, error=str(e))

    async def _add_internal_links(self, article_slug: str) -> EnhancementResult:
        """Find and suggest internal links using link builder service."""
        try:
            from services.link_builder_service import LinkBuilderService
            link_builder = LinkBuilderService()

            # Find related articles
            related = link_builder.find_related_articles(article_slug, max_links=5)

            if not related:
                return EnhancementResult(
                    success=True,
                    details={"message": "No link opportunities found", "links_found": 0}
                )

            # Also add CTA if missing
            cta_result = link_builder.add_cta_to_article(article_slug, dry_run=False)

            return EnhancementResult(
                success=True,
                details={
                    "links_found": len(related),
                    "suggested_links": [
                        {"title": r["title"], "slug": r["slug"], "score": r["score"]}
                        for r in related
                    ],
                    "cta_added": cta_result.get("cta_added", False)
                }
            )

        except ImportError:
            logger.warning("Link builder service not available")
            return EnhancementResult(
                success=False,
                error="Link builder service not available"
            )
        except Exception as e:
            return EnhancementResult(success=False, error=str(e))

    async def _generate_ab_titles(self, article_slug: str) -> EnhancementResult:
        """Generate A/B title variants."""
        try:
            from services.ab_title_service import ab_title_service
            from services.link_builder_service import LinkBuilderService

            # Get article title first
            link_builder = LinkBuilderService()
            articles = link_builder._load_articles()
            article = next((a for a in articles if a["slug"] == article_slug), None)

            if not article:
                return EnhancementResult(
                    success=False,
                    error=f"Article not found: {article_slug}"
                )

            original_title = article.get("title", "")
            if not original_title:
                return EnhancementResult(
                    success=False,
                    error="Article has no title"
                )

            test = await ab_title_service.generate_variants(
                article_slug=article_slug,
                original_title=original_title,
                num_variants=3
            )

            return EnhancementResult(
                success=True,
                details={
                    "variants_created": len(test.variants),
                    "test_id": f"{article_slug}_abtest",
                    "original_title": test.original_title,
                    "variant_titles": [v.title for v in test.variants]
                }
            )

        except ImportError:
            logger.warning("A/B title service not available")
            return EnhancementResult(
                success=False,
                error="A/B title service not available"
            )
        except Exception as e:
            return EnhancementResult(success=False, error=str(e))

    # -------------------------------------------------------------------------
    # QUALITY VERIFICATION
    # -------------------------------------------------------------------------

    async def _verify_enhancement(
        self,
        article_slug: str,
        task_type: str,
        result: dict
    ) -> dict:
        """
        Verify enhancement quality.

        Returns verification result with passed/failed status.
        """
        verification = {
            "task_type": task_type,
            "verified_at": datetime.now().isoformat(),
            "passed": False,
            "checks": [],
            "issues": []
        }

        try:
            if task_type == TaskType.CITATIONS.value:
                verification = await self._verify_citations(article_slug, result)

            elif task_type == TaskType.INTERNAL_LINKS.value:
                verification = await self._verify_internal_links(article_slug, result)

            elif task_type == TaskType.AB_TITLES.value:
                verification = await self._verify_ab_titles(article_slug, result)

            elif task_type == TaskType.FULL_ENHANCEMENT.value:
                # Verify each component
                all_passed = True
                all_checks = []
                all_issues = []

                if "citations" in result:
                    cit_verify = await self._verify_citations(
                        article_slug, result["citations"].get("details", {})
                    )
                    all_checks.extend(cit_verify.get("checks", []))
                    all_issues.extend(cit_verify.get("issues", []))
                    all_passed = all_passed and cit_verify.get("passed", False)

                if "internal_links" in result:
                    link_verify = await self._verify_internal_links(
                        article_slug, result["internal_links"].get("details", {})
                    )
                    all_checks.extend(link_verify.get("checks", []))
                    all_issues.extend(link_verify.get("issues", []))
                    all_passed = all_passed and link_verify.get("passed", False)

                if "ab_titles" in result:
                    title_verify = await self._verify_ab_titles(
                        article_slug, result["ab_titles"].get("details", {})
                    )
                    all_checks.extend(title_verify.get("checks", []))
                    all_issues.extend(title_verify.get("issues", []))
                    all_passed = all_passed and title_verify.get("passed", False)

                verification["passed"] = all_passed
                verification["checks"] = all_checks
                verification["issues"] = all_issues

        except Exception as e:
            logger.error(f"Verification failed: {e}")
            verification["passed"] = False
            verification["issues"].append(f"Verification error: {e}")

        return verification

    async def _verify_citations(self, article_slug: str, result: dict) -> dict:
        """Verify citation quality."""
        checks = []
        issues = []

        citations_added = result.get("citations_added", 0)

        # Check: At least some citations added (if opportunities exist)
        if citations_added > 0:
            checks.append("citations_added")
        elif result.get("message") == "No citation opportunities found":
            checks.append("no_opportunities_valid")
        else:
            issues.append("No citations were added")

        # Check: Citations are from trusted sources
        sources = result.get("sources_used", [])
        trusted_domains = ["ifc.org", "afdb.org", "worldbank.org", "imf.org"]
        trusted_count = sum(1 for s in sources if any(d in str(s) for d in trusted_domains))

        if len(sources) == 0 or trusted_count > 0:
            checks.append("trusted_sources")
        else:
            issues.append("No citations from trusted sources")

        return {
            "task_type": "citations",
            "verified_at": datetime.now().isoformat(),
            "passed": len(issues) == 0,
            "checks": checks,
            "issues": issues
        }

    async def _verify_internal_links(self, article_slug: str, result: dict) -> dict:
        """Verify internal link quality."""
        checks = []
        issues = []

        links_added = result.get("links_added", 0)

        # Check: Some links added
        if links_added > 0:
            checks.append("links_added")
        elif result.get("message") == "No link opportunities found":
            checks.append("no_opportunities_valid")
        else:
            issues.append("No internal links were added")

        # Check: Not too many links (max 7)
        if links_added <= 7:
            checks.append("reasonable_count")
        else:
            issues.append(f"Too many links added ({links_added})")

        return {
            "task_type": "internal_links",
            "verified_at": datetime.now().isoformat(),
            "passed": len(issues) == 0,
            "checks": checks,
            "issues": issues
        }

    async def _verify_ab_titles(self, article_slug: str, result: dict) -> dict:
        """Verify A/B title quality."""
        checks = []
        issues = []

        variants_created = result.get("variants_created", 0)

        # Check: Variants were created
        if variants_created >= 2:
            checks.append("variants_created")
        else:
            issues.append(f"Not enough variants created ({variants_created})")

        # Check: Test was registered
        if result.get("test_id"):
            checks.append("test_registered")
        else:
            issues.append("A/B test not registered")

        return {
            "task_type": "ab_titles",
            "verified_at": datetime.now().isoformat(),
            "passed": len(issues) == 0,
            "checks": checks,
            "issues": issues
        }

    # -------------------------------------------------------------------------
    # STATUS & REPORTING
    # -------------------------------------------------------------------------

    def get_status(self) -> dict:
        """Get orchestrator status."""
        state = self._load_state()
        stats = task_tracker.get_overall_stats()
        daily = task_tracker.get_daily_stats()

        return {
            "orchestrator": {
                "is_running": self._is_running,
                "last_run": state.get("last_run"),
                "current_task": state.get("current_task"),
                "articles_processed": state.get("articles_processed", 0),
                "errors_today": state.get("errors_today", 0),
                "last_error": state.get("last_error")
            },
            "task_stats": stats,
            "daily_stats": daily,
            "pending_count": len(task_tracker.get_pending_tasks())
        }


# Singleton instance
enhancement_orchestrator = EnhancementOrchestrator()
