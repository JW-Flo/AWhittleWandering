# 48Continental Roadtrip

A handcrafted 60-day roadtrip through all 48 continental U.S. states. This is the project site, route tracker, and content backend powering it.

## 🌎 What This Repo Does

- A full static website served via **Cloudflare Pages**
- A dynamic **Cloudflare Worker** for tracking the current stop, next stop, and ETA
- An embedded frontend script to keep the route live

## 📁 Project Structure

```text
48Continental/
├── public-site/
│   ├── index.html
│   ├── styles.css
│   └── scripts/
│       └── tracker.js
├── cloudflare/
│   └── route-tracker/
│       ├── src/index.js
│       └── wrangler.toml
└── README.md
```

## 🧭 Road Tracker API

### `GET` route status
Returns the current and next stop and ETA.

### `POST` update route
Secured with bearer token (`ADMIN_TOKEN`).

## 🛠 Setup Instructions

### Deploy the Cloudflare Worker
```
cd cloudflare/route-tracker
wrangler deploy
```

Set the secret token:
```
wrangler secret put ADMIN_TOKEN
```

### Deploy the Website to Cloudflare Pages
Point to the `public-site/` directory.

## ✨ Design Philosophy

- Bold, modern, mobile-first
- Text and story-driven
- Built for fast sharing from the road