<?php
declare(strict_types=1);

/**
 * RYCP Rwanda Community contact form handler.
 * Sends mail using PHP's built-in mail() function, which is available
 * on virtually all cPanel / shared hosting accounts with no API key,
 * no external service, and no extra cost.
 */

$recipient = 'info@rycpcbc.org.rw';
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

$mailSubject = 'RYCP website message: ' . $subject;

$body = "New message from the RYCP Rwanda Community website contact form.\n\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Subject: {$subject}\n\n"
    . "Message:\n{$message}\n";

$headers = "From: RYCP Website <{$siteDomainFromAddress}>\r\n"
    . "Reply-To: {$name} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($recipient, $mailSubject, $body, $headers);

respond(
    $sent,
    $sent ? 'Message sent, thank you.' : 'The message could not be sent right now.',
    $isAjax
);
