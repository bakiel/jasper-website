"""
JASPER Portal - Security Module Tests
Tests for authentication, rate limiting, and security utilities
"""

import pytest
from datetime import datetime, timedelta

import sys
sys.path.insert(0, str(__file__).rsplit("/", 3)[0])

from app.core.security import (
    CSRFProtection,
    RateLimiter,
    sanitize_string,
    sanitize_email,
    validate_password_strength,
    generate_secure_token,
    generate_api_key,
)


class TestCSRFProtection:
    """Tests for CSRF token generation and validation"""

    def test_generate_token(self):
        """Test that CSRF tokens are generated correctly"""
        csrf = CSRFProtection(secret_key="test-secret-key")
        token = csrf.generate_token()

        assert token is not None
        assert len(token) > 50  # Should be reasonably long
        assert ":" in token  # Should have timestamp separator

    def test_validate_valid_token(self):
        """Test that valid tokens are accepted"""
        csrf = CSRFProtection(secret_key="test-secret-key")
        token = csrf.generate_token()

        assert csrf.validate_token(token) is True

    def test_validate_invalid_token(self):
        """Test that invalid tokens are rejected"""
        csrf = CSRFProtection(secret_key="test-secret-key")

        assert csrf.validate_token("invalid-token") is False
        assert csrf.validate_token("") is False
        assert csrf.validate_token("a:b") is False

    def test_validate_tampered_token(self):
        """Test that tampered tokens are rejected"""
        csrf = CSRFProtection(secret_key="test-secret-key")
        token = csrf.generate_token()

        # Tamper with the signature
        parts = token.split(":")
        parts[-1] = "tampered"
        tampered_token = ":".join(parts)

        assert csrf.validate_token(tampered_token) is False

    def test_different_secrets_generate_different_tokens(self):
        """Test that different secrets produce different signatures"""
        csrf1 = CSRFProtection(secret_key="secret-1")
        csrf2 = CSRFProtection(secret_key="secret-2")

        token1 = csrf1.generate_token()
        token2 = csrf2.generate_token()

        # Same token from csrf1 should not validate with csrf2
        assert csrf2.validate_token(token1) is False


class TestRateLimiter:
    """Tests for rate limiting functionality"""

    def test_allows_requests_under_limit(self):
        """Test that requests under the limit are allowed"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)

        for i in range(5):
            assert limiter.is_allowed("test-ip") is True

    def test_blocks_requests_over_limit(self):
        """Test that requests over the limit are blocked"""
        limiter = RateLimiter(max_requests=3, window_seconds=60)

        for i in range(3):
            limiter.is_allowed("test-ip")

        # 4th request should be blocked
        assert limiter.is_allowed("test-ip") is False

    def test_different_ips_have_separate_limits(self):
        """Test that different IPs have independent rate limits"""
        limiter = RateLimiter(max_requests=2, window_seconds=60)

        # Max out IP 1
        for i in range(2):
            limiter.is_allowed("ip-1")

        # IP 2 should still be allowed
        assert limiter.is_allowed("ip-2") is True

    def test_get_remaining(self):
        """Test getting remaining requests"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)

        assert limiter.get_remaining("new-ip") == 5

        limiter.is_allowed("new-ip")
        limiter.is_allowed("new-ip")

        assert limiter.get_remaining("new-ip") == 3


class TestInputSanitization:
    """Tests for input sanitization functions"""

    def test_sanitize_string_basic(self):
        """Test basic string sanitization"""
        assert sanitize_string("  hello world  ") == "hello world"
        assert sanitize_string("test") == "test"

    def test_sanitize_string_null_bytes(self):
        """Test removal of null bytes"""
        assert sanitize_string("test\x00string") == "teststring"

    def test_sanitize_string_max_length(self):
        """Test string truncation at max length"""
        long_string = "a" * 2000
        result = sanitize_string(long_string, max_length=100)
        assert len(result) == 100

    def test_sanitize_string_empty(self):
        """Test empty string handling"""
        assert sanitize_string("") == ""
        assert sanitize_string(None) == ""

    def test_sanitize_email_basic(self):
        """Test basic email sanitization"""
        assert sanitize_email("Test@Example.COM") == "test@example.com"
        assert sanitize_email("  user@domain.org  ") == "user@domain.org"

    def test_sanitize_email_removes_dangerous_chars(self):
        """Test that dangerous characters are removed from emails"""
        assert sanitize_email("user<script>@domain.com") == "userscript@domain.com"


class TestPasswordValidation:
    """Tests for password strength validation"""

    def test_valid_password(self):
        """Test that valid passwords pass"""
        is_valid, message = validate_password_strength("SecurePass123!")
        assert is_valid is True

    def test_password_too_short(self):
        """Test that short passwords fail"""
        is_valid, message = validate_password_strength("Short1!")
        assert is_valid is False
        assert "12 characters" in message

    def test_password_no_uppercase(self):
        """Test that passwords without uppercase fail"""
        is_valid, message = validate_password_strength("lowercase123!!")
        assert is_valid is False

    def test_password_no_lowercase(self):
        """Test that passwords without lowercase fail"""
        is_valid, message = validate_password_strength("UPPERCASE123!!")
        assert is_valid is False

    def test_password_no_numbers(self):
        """Test that passwords without numbers fail"""
        is_valid, message = validate_password_strength("NoNumbers!!abc")
        assert is_valid is False

    def test_password_no_special(self):
        """Test that passwords without special chars fail"""
        is_valid, message = validate_password_strength("NoSpecial12345")
        assert is_valid is False


class TestTokenGeneration:
    """Tests for secure token generation"""

    def test_generate_secure_token(self):
        """Test secure token generation"""
        token = generate_secure_token()
        assert token is not None
        assert len(token) > 30

    def test_tokens_are_unique(self):
        """Test that generated tokens are unique"""
        tokens = [generate_secure_token() for _ in range(100)]
        assert len(set(tokens)) == 100

    def test_generate_api_key(self):
        """Test API key generation"""
        key = generate_api_key()
        assert key.startswith("jsp_")
        assert len(key) > 40
