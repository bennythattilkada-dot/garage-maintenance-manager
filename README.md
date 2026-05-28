# Garage Maintenance Manager

A small browser-based garage maintenance app for managing workshop jobs, customers, vehicles, parts inventory, and invoices.

## Features

- Dashboard with open jobs, ready vehicles, low-stock parts, and unpaid invoices
- User login with admin, service advisor, and technician privileges
- Repair job tracking with status updates
- Customer and vehicle records with selectable brand and color
- Technician clock-in/clock-out with shift history
- Parts inventory with low-stock warnings
- Invoice cards with payment status
- Search across the active data
- Local browser storage, so records stay after refresh

## Run

Open `index.html` directly in a browser, or serve the folder locally:

```powershell
.\run.ps1
```

Then open:

```text
http://localhost:4173/
```

If PowerShell script execution is restricted, run one of these commands from this folder:

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

## Project Files

- `index.html` contains the application layout and dialogs.
- `styles.css` contains the responsive interface styling.
- `app.js` contains the app state, rendering, localStorage persistence, time clock, and interactions.

## Demo Login

The app includes demo accounts:

```text
admin / admin123
advisor / advisor123
tech / tech123
```

Admin users can manage all records and users. Service advisors can manage jobs, customers, parts, and invoices. Technician users can use the time clock.
- `run.ps1` starts a local development server.

## Notes

This is a front-end MVP. Data is stored in the current browser with `localStorage`. For a production garage system, the next step would be a backend database, secure password hashing, server-side permissions, job history, technician payroll reports, printable invoices, and backups.
