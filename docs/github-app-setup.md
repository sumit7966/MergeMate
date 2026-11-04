# GitHub App Setup & Integration Guide

This guide walks you through registering and connecting a real GitHub App with MergeMate.

---

## 1. Create a GitHub App in GitHub Settings

1. In GitHub, navigate to **Settings** > **Developer settings** > **GitHub Apps** > **New GitHub App**.
2. Fill in the general settings:
   - **GitHub App name**: `MergeMate AI Reviewer` (or your company brand)
   - **Homepage URL**: `https://your-domain.com` (or `http://localhost:5173` for dev)
   - **Callback URL**: `http://localhost:8000/api/v1/github/callback`
   - **Webhook URL**: `https://your-domain.com/api/v1/webhooks/github` (use ngrok/localtunnel for local dev)
   - **Webhook secret**: Generate a secure 32+ character random string and save it to `.env` as `GITHUB_WEBHOOK_SECRET`.

---

## 2. Configure Required Permissions

Set the following repository permissions:

| Permission | Access | Purpose |
| :--- | :--- | :--- |
| **Pull requests** | Read & write | Fetch PR metadata, changed files, and publish inline review comments. |
| **Repository contents** | Read-only | Fetch file diffs and surrounding context. |
| **Checks** | Read & write | Publish GitHub Check runs with review verdicts. |
| **Metadata** | Read-only | Default mandatory permission. |

---

## 3. Subscribe to Webhook Events

Check the following event subscriptions:
- `Pull request` (triggers when PRs are opened, synchronized, reopened, or closed)
- `Installation` (tracks when repositories add or remove MergeMate)

---

## 4. Generate Private Key

1. Under **Private keys**, click **Generate a private key**.
2. A `.pem` file will download to your computer.
3. Open the `.pem` file, copy its content, and set it in your `.env` file:
   ```env
   GITHUB_APP_ID=123456
   GITHUB_APP_CLIENT_ID=Iv1.xxxxxxxxxxxx
   GITHUB_APP_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GITHUB_WEBHOOK_SECRET=your_configured_webhook_secret_here
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
   ```

---

## 5. Install the App on Repositories

1. Click **Install App** in the left sidebar of your GitHub App settings.
2. Select your account or organization.
3. Choose either **All repositories** or select specific target repositories.
4. MergeMate will automatically receive the `installation` webhook and synchronize the repositories.
