# Welcome to your Lovable project

## Connect Mobile App To CreadiTn Backend

This mobile app now calls backend APIs for:
- Login: `/api/auth/login`
- Home: merchants, score, installments, payments, notifications
- Shops: `/api/merchants`
- Credit: `/api/credits/simulate` and `/api/credits/request`
- Installments: `/api/credits/my-installments` and payment endpoint
- Profile: `/api/users/profile` and `/api/kyc/status`

1. Start backend in `../creadiTn` on port `8082`.
2. In `frontend mobile`, create a `.env` file with:

```sh
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MACHINE_IP:8082
```

Use one of these values depending on where you run the app:
- Android emulator: `http://10.0.2.2:8082`
- iOS simulator / web (same machine): `http://localhost:8082`
- Physical phone on same Wi-Fi: `http://<your-lan-ip>:8082`

3. Run the mobile app with `npm run start`.

## QR Code "Could Not Connect To Server" Fix

If Expo Go cannot connect after scanning QR:

1. Use tunnel mode (already default now):

```sh
npm run start
```

2. If needed, force tunnel manually:

```sh
npm run start:tunnel
```

3. Make sure backend URL is not `localhost` when testing on phone.
	- Use `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8082`

4. Ensure phone and PC are on same network, and allow Node/Java in Windows Firewall.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
