# JASPER Backend Build Plan
## Email-Integrated Contact System

**Version:** 1.0
**Date:** December 7, 2025
**Status:** Planning
**Email:** models@jasperfinance.org

---

## 1. System Overview

### What We're Building

A lightweight backend that:
1. **Receives** contact form submissions from the React frontend
2. **Sends** professional HTML emails to `models@jasperfinance.org`
3. **Auto-responds** to clients with branded confirmation
4. **Stores** leads in database for CRM tracking
5. **Integrates** with existing HQ design aesthetic

### Architecture Decision: PHP + Hostinger Native

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **PHP 8.x (Hostinger)** | Free hosting, native SMTP, MySQL included | Older ecosystem | **CHOSEN** |
| Node.js (Vercel) | Modern, same as frontend | Email complexity, costs | Not chosen |
| Python (VPS) | Powerful AI integration | Extra server cost | Later phase |

**Why PHP:** Zero additional hosting cost. Hostinger provides free MySQL, native PHP 8.x, and SMTP (30,000 emails/month). Perfect for lead capture.

---

## 2. Email Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     JASPER EMAIL FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    POST /api/contact    ┌──────────────────────┐  │
│  │   React     │ ──────────────────────► │   PHP API            │  │
│  │   Contact   │                         │   (api.jasperfinance │  │
│  │   Form      │ ◄────────────────────── │   .org)              │  │
│  └─────────────┘    JSON Response        └──────────────────────┘  │
│                                                    │                │
│                                                    │ 1. Validate    │
│                                                    │ 2. Store DB    │
│                                                    │ 3. Send Emails │
│                                                    ▼                │
│                                          ┌──────────────────────┐  │
│                                          │   Hostinger SMTP     │  │
│                                          │   smtp.hostinger.com │  │
│                                          │   :587 (TLS)         │  │
│                                          └──────────────────────┘  │
│                                                    │                │
│                          ┌─────────────────────────┼────────────┐  │
│                          ▼                         ▼            │  │
│                 ┌─────────────────┐    ┌─────────────────────┐ │  │
│                 │ ADMIN EMAIL     │    │ CLIENT AUTO-REPLY   │ │  │
│                 │ New Lead Alert  │    │ Confirmation Email  │ │  │
│                 │ models@jasper.. │    │ To: client@email    │ │  │
│                 └─────────────────┘    └─────────────────────┘ │  │
│                                                                 │  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure

```
jasper-api/                          # Subdomain: api.jasperfinance.org
├── public/
│   ├── index.php                    # Entry point (Slim Framework)
│   └── .htaccess                    # Apache URL rewriting
│
├── src/
│   ├── Controllers/
│   │   └── ContactController.php    # Handle form submissions
│   │
│   ├── Services/
│   │   ├── EmailService.php         # SMTP sending logic
│   │   └── ValidationService.php    # Input validation
│   │
│   ├── Templates/
│   │   ├── admin-notification.html  # Email to models@
│   │   └── client-confirmation.html # Auto-reply to client
│   │
│   └── Models/
│       └── Lead.php                 # Database model
│
├── config/
│   ├── database.php                 # MySQL connection
│   └── email.php                    # SMTP settings
│
├── storage/
│   └── logs/                        # Error logs
│
├── vendor/                          # Composer dependencies
├── composer.json
└── .env                             # Environment variables
```

---

## 4. Database Schema

### leads Table

```sql
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Contact Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),

    -- Project Details
    sector ENUM('renewable-energy', 'data-centres', 'agri-industrial',
                'climate-finance', 'technology', 'manufacturing', 'other') NOT NULL,
    funding_amount ENUM('5-15m', '15-75m', '75-250m', '250m+') NOT NULL,
    target_dfi VARCHAR(255),
    project_description TEXT NOT NULL,
    timeline ENUM('4-6weeks', '6-8weeks', '8-12weeks', 'flexible'),

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),

    -- Status Tracking
    status ENUM('new', 'contacted', 'qualified', 'proposal_sent',
                'won', 'lost', 'spam') DEFAULT 'new',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Email Templates (HQ Design)

### Admin Notification Email

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New JASPER Lead</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0B1221; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <span style="color: #2C8A5B; font-size: 24px; font-weight: bold; letter-spacing: 2px;">JASPER</span>
                                    </td>
                                    <td align="right">
                                        <span style="background: linear-gradient(135deg, #2C8A5B 0%, #44D685 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">NEW LEAD</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">

                            <!-- Funding Badge -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <span style="background-color: rgba(44,138,91,0.15); color: #44D685; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: bold; display: inline-block;">
                                    {{FUNDING_AMOUNT}}
                                </span>
                                <p style="color: #9CA3AF; margin: 8px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Funding Sought</p>
                            </div>

                            <!-- Contact Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 8px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Name</p>
                                        <p style="color: #FFFFFF; font-size: 16px; margin: 0; font-weight: 500;">{{NAME}}</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 8px 0 0 8px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Email</p>
                                        <p style="color: #2C8A5B; font-size: 14px; margin: 0;">{{EMAIL}}</p>
                                    </td>
                                    <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 0 8px 8px 0; border-left: 1px solid rgba(255,255,255,0.05);">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Company</p>
                                        <p style="color: #FFFFFF; font-size: 14px; margin: 0;">{{COMPANY}}</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 8px 0 0 8px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Sector</p>
                                        <p style="color: #FFFFFF; font-size: 14px; margin: 0;">{{SECTOR}}</p>
                                    </td>
                                    <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 0 8px 8px 0; border-left: 1px solid rgba(255,255,255,0.05);">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Target DFI</p>
                                        <p style="color: #FFFFFF; font-size: 14px; margin: 0;">{{TARGET_DFI}}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Project Description -->
                            <div style="padding: 20px; background-color: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid #2C8A5B; margin-bottom: 24px;">
                                <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Project Description</p>
                                <p style="color: #E5E7EB; font-size: 14px; line-height: 1.6; margin: 0;">{{PROJECT_DESCRIPTION}}</p>
                            </div>

                            <!-- Timeline -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 8px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Requested Timeline</p>
                                        <p style="color: #F59E0B; font-size: 14px; margin: 0; font-weight: 500;">{{TIMELINE}}</p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <p style="color: #6B7280; font-size: 12px; margin: 0;">
                                Received {{TIMESTAMP}} &bull; IP: {{IP_ADDRESS}}
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Client Auto-Reply Email

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - JASPER Financial Architecture</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0B1221; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 32px 40px; text-align: center;">
                            <span style="color: #2C8A5B; font-size: 28px; font-weight: bold; letter-spacing: 3px;">JASPER</span>
                            <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0 0 0;">Financial Architecture</p>
                        </td>
                    </tr>

                    <!-- Success Icon -->
                    <tr>
                        <td align="center" style="padding: 0 40px 24px 40px;">
                            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(44,138,91,0.2) 0%, rgba(68,214,133,0.1) 100%); border-radius: 50%; display: inline-block; line-height: 64px;">
                                <span style="color: #2C8A5B; font-size: 28px;">&#10003;</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">

                            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                                Inquiry Received
                            </h1>

                            <p style="color: #9CA3AF; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 32px 0;">
                                Thank you for your interest in JASPER Financial Architecture, {{NAME}}. We've received your project inquiry and will review it within <strong style="color: #FFFFFF;">48 hours</strong>.
                            </p>

                            <!-- What Happens Next -->
                            <div style="background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                <p style="color: #FFFFFF; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">What happens next:</p>

                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <table cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="width: 28px; vertical-align: top;">
                                                        <span style="color: #2C8A5B; font-weight: bold;">1.</span>
                                                    </td>
                                                    <td style="color: #D1D5DB; font-size: 14px;">
                                                        We review your project details against our qualification criteria
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <table cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="width: 28px; vertical-align: top;">
                                                        <span style="color: #2C8A5B; font-weight: bold;">2.</span>
                                                    </td>
                                                    <td style="color: #D1D5DB; font-size: 14px;">
                                                        If we're a fit, we'll send a detailed proposal with scope and timeline
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <table cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="width: 28px; vertical-align: top;">
                                                        <span style="color: #2C8A5B; font-weight: bold;">3.</span>
                                                    </td>
                                                    <td style="color: #D1D5DB; font-size: 14px;">
                                                        If not, we'll tell you honestly and may suggest alternatives
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Your Submission -->
                            <div style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px;">
                                <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Your Submission</p>

                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="color: #9CA3AF; font-size: 13px; padding: 4px 0;">Sector:</td>
                                        <td style="color: #FFFFFF; font-size: 13px; padding: 4px 0; text-align: right;">{{SECTOR}}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #9CA3AF; font-size: 13px; padding: 4px 0;">Funding:</td>
                                        <td style="color: #2C8A5B; font-size: 13px; padding: 4px 0; text-align: right; font-weight: 600;">{{FUNDING_AMOUNT}}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #9CA3AF; font-size: 13px; padding: 4px 0;">Timeline:</td>
                                        <td style="color: #FFFFFF; font-size: 13px; padding: 4px 0; text-align: right;">{{TIMELINE}}</td>
                                    </tr>
                                </table>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0;">
                                Questions? Reply to this email or contact us at
                            </p>
                            <a href="mailto:models@jasperfinance.org" style="color: #2C8A5B; font-size: 13px; text-decoration: none; font-weight: 500;">models@jasperfinance.org</a>

                            <p style="color: #4B5563; font-size: 11px; margin: 24px 0 0 0;">
                                &copy; 2025 JASPER Financial Architecture &bull; DFI Investment Packages
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 6. PHP API Implementation

### composer.json

```json
{
    "name": "jasper/api",
    "description": "JASPER Financial Architecture API",
    "require": {
        "php": "^8.1",
        "slim/slim": "^4.0",
        "slim/psr7": "^1.6",
        "phpmailer/phpmailer": "^6.8",
        "vlucas/phpdotenv": "^5.5"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    }
}
```

### public/index.php

```php
<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$app = AppFactory::create();

// CORS Middleware
$app->add(function (Request $request, $handler): Response {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', 'https://jasperfinance.org')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type')
        ->withHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
});

// Handle preflight
$app->options('/contact', function (Request $request, Response $response) {
    return $response;
});

// Contact endpoint
$app->post('/contact', \App\Controllers\ContactController::class . ':submit');

$app->run();
```

### src/Controllers/ContactController.php

```php
<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\EmailService;
use App\Services\ValidationService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ContactController
{
    private PDO $db;
    private EmailService $email;
    private ValidationService $validator;

    public function __construct()
    {
        // Database connection
        $this->db = new PDO(
            "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4",
            $_ENV['DB_USER'],
            $_ENV['DB_PASS'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $this->email = new EmailService();
        $this->validator = new ValidationService();
    }

    public function submit(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            // Validate
            $errors = $this->validator->validateContact($data);
            if (!empty($errors)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'errors' => $errors
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Get metadata
            $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown';
            $userAgent = $request->getHeaderLine('User-Agent');
            $referrer = $request->getHeaderLine('Referer');

            // Store in database
            $stmt = $this->db->prepare("
                INSERT INTO leads (name, email, company, sector, funding_amount,
                                   target_dfi, project_description, timeline,
                                   ip_address, user_agent, referrer)
                VALUES (:name, :email, :company, :sector, :funding_amount,
                        :target_dfi, :project_description, :timeline,
                        :ip_address, :user_agent, :referrer)
            ");

            $stmt->execute([
                ':name' => $data['name'],
                ':email' => $data['email'],
                ':company' => $data['company'] ?? '',
                ':sector' => $data['sector'],
                ':funding_amount' => $data['fundingAmount'],
                ':target_dfi' => $data['targetDFI'] ?? '',
                ':project_description' => $data['projectDescription'],
                ':timeline' => $data['timeline'] ?? 'flexible',
                ':ip_address' => $ip,
                ':user_agent' => $userAgent,
                ':referrer' => $referrer
            ]);

            $leadId = $this->db->lastInsertId();

            // Send admin notification
            $this->email->sendAdminNotification($data, $ip);

            // Send client auto-reply
            $this->email->sendClientConfirmation($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Inquiry received. We will respond within 48 hours.',
                'id' => $leadId
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Contact submission error: " . $e->getMessage());

            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'An error occurred. Please try again or email us directly.'
            ]));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
```

### src/Services/EmailService.php

```php
<?php
declare(strict_types=1);

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private string $smtpHost = 'smtp.hostinger.com';
    private int $smtpPort = 587;
    private string $smtpUser;
    private string $smtpPass;
    private string $fromEmail = 'models@jasperfinance.org';
    private string $fromName = 'JASPER Financial Architecture';

    public function __construct()
    {
        $this->smtpUser = $_ENV['SMTP_USER'];
        $this->smtpPass = $_ENV['SMTP_PASS'];
    }

    public function sendAdminNotification(array $data, string $ip): bool
    {
        $mail = $this->createMailer();

        try {
            $mail->addAddress('models@jasperfinance.org');
            $mail->Subject = "New Lead: {$data['name']} - {$this->formatFunding($data['fundingAmount'])}";

            // Load and populate template
            $template = file_get_contents(__DIR__ . '/../Templates/admin-notification.html');
            $html = $this->populateTemplate($template, [
                'NAME' => htmlspecialchars($data['name']),
                'EMAIL' => htmlspecialchars($data['email']),
                'COMPANY' => htmlspecialchars($data['company'] ?? 'Not provided'),
                'SECTOR' => $this->formatSector($data['sector']),
                'FUNDING_AMOUNT' => $this->formatFunding($data['fundingAmount']),
                'TARGET_DFI' => htmlspecialchars($data['targetDFI'] ?? 'Not specified'),
                'PROJECT_DESCRIPTION' => nl2br(htmlspecialchars($data['projectDescription'])),
                'TIMELINE' => $this->formatTimeline($data['timeline'] ?? 'flexible'),
                'TIMESTAMP' => date('M j, Y \a\t g:i A T'),
                'IP_ADDRESS' => $ip
            ]);

            $mail->msgHTML($html);
            $mail->send();

            return true;
        } catch (Exception $e) {
            error_log("Admin email failed: " . $mail->ErrorInfo);
            return false;
        }
    }

    public function sendClientConfirmation(array $data): bool
    {
        $mail = $this->createMailer();

        try {
            $mail->addAddress($data['email'], $data['name']);
            $mail->Subject = "Thank You - JASPER Financial Architecture";

            // Load and populate template
            $template = file_get_contents(__DIR__ . '/../Templates/client-confirmation.html');
            $html = $this->populateTemplate($template, [
                'NAME' => htmlspecialchars($data['name']),
                'SECTOR' => $this->formatSector($data['sector']),
                'FUNDING_AMOUNT' => $this->formatFunding($data['fundingAmount']),
                'TIMELINE' => $this->formatTimeline($data['timeline'] ?? 'flexible')
            ]);

            $mail->msgHTML($html);
            $mail->send();

            return true;
        } catch (Exception $e) {
            error_log("Client email failed: " . $mail->ErrorInfo);
            return false;
        }
    }

    private function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $this->smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $this->smtpUser;
        $mail->Password = $this->smtpPass;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $this->smtpPort;
        $mail->setFrom($this->fromEmail, $this->fromName);
        $mail->isHTML(true);

        return $mail;
    }

    private function populateTemplate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace("{{{$key}}}", $value, $template);
        }
        return $template;
    }

    private function formatSector(string $sector): string
    {
        $map = [
            'renewable-energy' => 'Renewable Energy',
            'data-centres' => 'Data Centres',
            'agri-industrial' => 'Agri-Industrial',
            'climate-finance' => 'Climate Finance',
            'technology' => 'Technology & Platforms',
            'manufacturing' => 'Manufacturing & Processing',
            'other' => 'Other'
        ];
        return $map[$sector] ?? $sector;
    }

    private function formatFunding(string $funding): string
    {
        $map = [
            '5-15m' => '$5M - $15M',
            '15-75m' => '$15M - $75M',
            '75-250m' => '$75M - $250M',
            '250m+' => '$250M+'
        ];
        return $map[$funding] ?? $funding;
    }

    private function formatTimeline(string $timeline): string
    {
        $map = [
            '4-6weeks' => '4-6 Weeks',
            '6-8weeks' => '6-8 Weeks',
            '8-12weeks' => '8-12 Weeks',
            'flexible' => 'Flexible / No Rush'
        ];
        return $map[$timeline] ?? $timeline;
    }
}
```

### .env Template

```env
# Database
DB_HOST=localhost
DB_NAME=jasper_crm
DB_USER=jasper_user
DB_PASS=your_secure_password

# SMTP (Hostinger)
SMTP_USER=models@jasperfinance.org
SMTP_PASS=your_email_password

# App
APP_ENV=production
APP_DEBUG=false
```

---

## 7. Frontend Integration

### Update contact/page.tsx

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const response = await fetch('https://api.jasperfinance.org/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
            setIsSubmitted(true);
        } else {
            // Handle error - show message to user
            console.error('Submission failed:', result.errors || result.message);
            alert(result.message || 'Submission failed. Please try again.');
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error. Please try again or email us directly at models@jasperfinance.org');
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## 8. Deployment Steps

### Phase 1: Hostinger Setup
1. Create subdomain `api.jasperfinance.org`
2. Create MySQL database `jasper_crm`
3. Run SQL schema to create `leads` table
4. Upload PHP files via FTP or Git

### Phase 2: Email Configuration
1. Verify SMTP credentials for `models@jasperfinance.org`
2. Test email sending from PHP
3. Verify emails land in inbox (not spam)

### Phase 3: Frontend Connection
1. Update React form to POST to API
2. Add error handling UI
3. Test full flow

### Phase 4: Monitoring
1. Set up error logging
2. Create simple admin view for leads (Phase 2)
3. Monitor email deliverability

---

## 9. Cost Summary

| Item | Monthly Cost |
|------|-------------|
| PHP Hosting | R0 (included) |
| MySQL Database | R0 (included) |
| SMTP Email (30K/month) | R0 (included) |
| Subdomain SSL | R0 (included) |
| **Total** | **R0** |

---

## 10. Next Steps

1. [ ] Create `api.jasperfinance.org` subdomain on Hostinger
2. [ ] Set up MySQL database
3. [ ] Deploy PHP API
4. [ ] Test email flow
5. [ ] Update React frontend
6. [ ] Go live

---

*Document Version: 1.0*
*Created: December 7, 2025*
*Author: JASPER Financial Architecture*
