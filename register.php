<?php
declare(strict_types=1);

/**
 * RYCP Rwanda Community membership registration form handler.
 * Mirrors contact.php's approach and safeguards: PHP's built-in mail(),
 * no API key or external service needed on cPanel / shared hosting.
 *
 * $recipient is the RYCP inbox that receives every registration.
 *
 * $siteDomainFromAddress is the From/envelope-sender address (see the -f
 * flag below). It must stay a mailbox on our own domain -- it is NOT the
 * applicant's address. Setting From to an arbitrary applicant email would
 * fail SPF/DKIM and get the message rejected or spam-filtered by most
 * providers. The applicant's own email (from the form) is instead put in
 * Reply-To, so whoever reads the message in $recipient can just hit
 * "Reply" and it goes straight back to the applicant.
 */

// Never let a PHP warning/notice leak into the response body: the JS side
// parses this endpoint's output as JSON, and even one stray HTML warning
// (e.g. from mail() on a host with no local MTA configured) would break
// that parse. Real errors still go to the server's error log below.
ini_set('display_errors', '0');
error_reporting(E_ALL);

$recipient = 'info@rycpcbc.org.rw';
$siteDomainFromAddress = 'info@rycpcbc.org.rw';

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
    && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

function respond(bool $ok, string $message, bool $isAjax): void
{
    if ($isAjax) {
        header('Content-Type: application/json');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['status' => $ok ? 'ok' : 'error', 'message' => $message]);
    } else {
        header('Location: membership.html?sent=' . ($ok ? '1' : '0') . '#register');
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Invalid request method.', $isAjax);
}

// Honeypot field: real visitors never fill this in. If it has a value,
// quietly pretend success so the bot moves on instead of retrying.
if (!empty($_POST['bot-field'])) {
    respond(true, 'Thanks!', $isAjax);
}

/**
 * Strips characters that could be used for email header injection
 * (a classic PHP mail() vulnerability when user input reaches headers).
 */
function cleanLine(string $value): string
{
    $value = str_replace(["\r", "\n", "%0a", "%0d", "%0A", "%0D"], '', $value);
    return trim($value);
}

$fullName = cleanLine((string) ($_POST['fullName'] ?? ''));
$companyName = cleanLine((string) ($_POST['companyName'] ?? ''));
$nationalId = cleanLine((string) ($_POST['nationalId'] ?? ''));
$tin = cleanLine((string) ($_POST['tin'] ?? ''));
$businessActivity = cleanLine((string) ($_POST['businessActivity'] ?? ''));
$province = cleanLine((string) ($_POST['province'] ?? ''));
$district = cleanLine((string) ($_POST['district'] ?? ''));
$sector = cleanLine((string) ($_POST['sector'] ?? ''));
$cell = cleanLine((string) ($_POST['cell'] ?? ''));
$village = cleanLine((string) ($_POST['village'] ?? ''));
$membershipLevel = cleanLine((string) ($_POST['membershipLevel'] ?? ''));
$email = cleanLine((string) ($_POST['email'] ?? ''));
$phone = cleanLine((string) ($_POST['phone'] ?? ''));

$required = [
    'Full Name' => $fullName,
    'National ID' => $nationalId,
    'Business Activity' => $businessActivity,
    'Province' => $province,
    'District' => $district,
    'Membership Level' => $membershipLevel,
    'Email' => $email,
    'Phone Number' => $phone,
];

foreach ($required as $value) {
    if ($value === '') {
        respond(false, 'Please fill in every required field before submitting.', $isAjax);
    }
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', $isAjax);
}

$mailSubject = mb_encode_mimeheader('New RYCP membership registration: ' . $fullName, 'UTF-8');

$body = "New membership registration from the RYCP Rwanda Community website.\n\n"
    . "Full Name: {$fullName}\n"
    . "Company Name: " . ($companyName !== '' ? $companyName : '(not registered yet)') . "\n"
    . "National ID: {$nationalId}\n"
    . "TIN Number: " . ($tin !== '' ? $tin : '(none provided)') . "\n"
    . "Business Activity: {$businessActivity}\n\n"
    . "Location:\n"
    . "  Province: {$province}\n"
    . "  District: {$district}\n"
    . "  Sector: " . ($sector !== '' ? $sector : '-') . "\n"
    . "  Cell: " . ($cell !== '' ? $cell : '-') . "\n"
    . "  Village: " . ($village !== '' ? $village : '-') . "\n\n"
    . "Membership Level: {$membershipLevel}\n"
    . "Email: {$email}\n"
    . "Phone: {$phone}\n";

$headers = "From: RYCP Website <{$siteDomainFromAddress}>\r\n"
    . "Reply-To: {$fullName} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n"
    . "X-Mailer: PHP/" . PHP_VERSION;

// The -f flag sets the envelope sender (Return-Path) to a real mailbox on
// our own domain. Without it, cPanel's Exim defaults to something like
// "username@serverhostname", which fails SPF for rycpcbc.org.rw and is the
// single most common reason PHP mail() from cPanel lands in spam or is
// dropped outright by providers like Gmail. Using info@rycpcbc.org.rw here
// also means any bounce notices land in a real, monitored inbox.
$envelopeSender = '-f' . $siteDomainFromAddress;

$sent = @mail($recipient, $mailSubject, $body, $headers, $envelopeSender);

if (!$sent) {
    // Log server-side for the host admin without leaking details to the visitor.
    $lastError = error_get_last();
    error_log('RYCP registration form: mail() returned false for recipient ' . $recipient
        . ($lastError ? ' - ' . $lastError['message'] : ''));
}

respond(
    $sent,
    $sent ? 'Registration received, thank you.' : 'The registration could not be sent right now.',
    $isAjax
);
