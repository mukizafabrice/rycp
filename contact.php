<?php
declare(strict_types=1);

/**
 * RYCP Rwanda Community contact form handler.
 * Sends mail using PHP's built-in mail() function, which is available
 * on virtually all cPanel / shared hosting accounts with no API key,
 * no external service, and no extra cost.
 *
 * Recipient is temporarily set to Caleb's personal inbox because the
 * info@rycpcbc.org.rw mailbox has not been created in cPanel yet. Once
 * it exists, change $recipient back to that address.
 */

// Never let a PHP warning/notice leak into the response body: the JS side
// parses this endpoint's output as JSON, and even one stray HTML warning
// (e.g. from mail() on a host with no local MTA configured) would break
// that parse. Real errors still go to the server's error log below.
ini_set('display_errors', '0');
error_reporting(E_ALL);

$recipient = 'tumwebazecaleb250@gmail.com';
$siteDomainFromAddress = 'no-reply@rycpcbc.org.rw';

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
    && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

function respond(bool $ok, string $message, bool $isAjax): void
{
    if ($isAjax) {
        header('Content-Type: application/json');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['status' => $ok ? 'ok' : 'error', 'message' => $message]);
    } else {
        header('Location: contact.html?sent=' . ($ok ? '1' : '0'));
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

$name = cleanLine((string) ($_POST['name'] ?? ''));
$email = cleanLine((string) ($_POST['email'] ?? ''));
$subject = cleanLine((string) ($_POST['subject'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    respond(false, 'Please fill in every field before sending.', $isAjax);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', $isAjax);
}

$mailSubject = mb_encode_mimeheader('RYCP website message: ' . $subject, 'UTF-8');

$body = "New message from the RYCP Rwanda Community website contact form.\n\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Subject: {$subject}\n\n"
    . "Message:\n{$message}\n";

$headers = "From: RYCP Website <{$siteDomainFromAddress}>\r\n"
    . "Reply-To: {$name} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n"
    . "X-Mailer: PHP/" . PHP_VERSION;

// The -f flag sets the envelope sender (Return-Path) to a mailbox on our own
// domain. Without it, cPanel's Exim defaults to something like
// "username@serverhostname", which fails SPF for rycpcbc.org.rw and is the
// single most common reason PHP mail() from cPanel lands in spam or is
// dropped outright by providers like Gmail. The address does not need an
// inbox behind it, but its domain must be one this cPanel account owns.
$envelopeSender = '-f' . $siteDomainFromAddress;

$sent = @mail($recipient, $mailSubject, $body, $headers, $envelopeSender);

if (!$sent) {
    // Log server-side for the host admin without leaking details to the visitor.
    $lastError = error_get_last();
    error_log('RYCP contact form: mail() returned false for recipient ' . $recipient
        . ($lastError ? ' - ' . $lastError['message'] : ''));
}

respond(
    $sent,
    $sent ? 'Message sent, thank you.' : 'The message could not be sent right now.',
    $isAjax
);
