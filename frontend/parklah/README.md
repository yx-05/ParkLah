# 🚗 ParkLah Mobile Application (Frontend)

[![React Native](https://img.shields.io/badge/Frontend-React%20Native%20%2F%20Expo%2054-00D8FF?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38)](https://github.com/pmndrs/zustand)
[![Tests](https://img.shields.io/badge/Tests-38%20Passing-success)](#)

The **ParkLah Mobile App** is a universal cross-platform mobile client built with **React Native**, **Expo SDK 54**, and **React 19**. It features sub-second WebSocket updates, live GPS tracking, turn-by-turn vector polylines, and dynamic AI parking demand forecasting.

---

## 📱 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Wi-Fi IP
Because physical smartphones running Expo Go cannot reach `localhost`, update your computer's local Wi-Fi IPv4 in `frontend/parklah/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_DEV_AUTO_LOGIN=false
```
*(Example: `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.26:3000`)*

### 3. Launch Development Server
```bash
npx expo start -c
```
- Scan the displayed QR code with your phone's Camera (iOS) or the **Expo Go** app (Android).
- Press **`w`** to preview directly in your desktop browser (`http://localhost:8081`).

---

## 🗂️ App Navigation & Key Screens

The client leverages **`expo-router`** with file-based routing:

| Route | File Path | Description |
| :--- | :--- | :--- |
| **Splash / Auth** | [`src/app/index.tsx`](file:///d:/University/ParkLah/frontend/parklah/src/app/index.tsx) | Phone OTP login & Zero-Friction **Quick Dev Login Bypass**. |
| **Role Selection** | [`src/app/(tabs)/selection.tsx`](file:///d:/University/ParkLah/frontend/parklah/src/app/%28tabs%29/selection.tsx) | Action hub: Choose between *"I'm Searching"* and *"I'm Leaving"*. |
| **Searcher Hub** | [`src/app/(tabs)/searcher.tsx`](file:///d:/University/ParkLah/frontend/parklah/src/app/%28tabs%29/searcher.tsx) | Autocomplete destination search, **AI Demand Forecast** card, live radar, 15s match offer modal, and turn-by-turn navigation HUD. |
| **Leaver Hub** | [`src/app/(tabs)/leaver.tsx`](file:///d:/University/ParkLah/frontend/parklah/src/app/%28tabs%29/leaver.tsx) | 3–5 min countdown departure broadcast, vehicle selection, and landmark chips. |
| **Wallet & Points** | [`src/app/(tabs)/points.tsx`](file:///d:/University/ParkLah/frontend/parklah/src/app/%28tabs%29/points.tsx) | Live balance, mock points reloading (+100, +200, +500 pts), and immutable transaction history. |

---

## 🧪 Running Automated Unit Tests

Verify that all 38 frontend unit tests pass:
```bash
npm test
```
