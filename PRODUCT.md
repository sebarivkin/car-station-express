# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 + TypeScript + Tailwind 4, Supabase (Postgres + Google login + RLS), deployed on Vercel. Chosen to match the owner's existing project ClientesTitan; free tier throughout.

## Users

Franco, owner of Car Station Express (lubricentro + taller mecánico in one shop), plus Sebastián (the developer/admin). Only these two sign in. Employees (Walter, Brian) never use the app; they appear only as records of salary advances.

Franco uses it at the shop counter on a PC and, during the day, from a phone or tablet in the workshop, often between jobs and with dirty hands.

## Product Purpose

Register every job done on every vehicle so the shop knows, per car, everything ever done to it, and so Franco sees revenue, cost and profit per area. Success: every service and repair gets logged in under a minute, the car's history is one search away, and the monthly numbers are trustworthy.

## Positioning

A single record for a mixed shop: oil-change services (catalogue articles) and mechanical repairs (manual labour + parts bought from distributors) live side by side on the same vehicle history, with cost and sale price captured at the moment of each job.

## Operating Context

- A customer arrives with a car; Franco searches by owner name, make, model or plate (patente).
- Lubricentro service: pick articles from a price list (Franco will supply the list with cost and sale price), quantities, km. No stock control.
- Taller job: free-text description, labour amount typed manually (varies by vehicle and condition), parts with cost, sale price and optionally the distributor where bought.
- Service and taller job are separate operations even on the same day.
- Payment: medium (efectivo / transferencia / tarjeta) and whether it is paid, pending or partially paid; pending balances must be chased.
- Employees Walter and Brian take salary advances during the month; only advances are tracked.
- Spanish (Argentina), pesos, dd/mm/yyyy.

## Capabilities and Constraints

Clients with one or more vehicles; vehicle history; search; article catalogue with import from Excel; services; taller jobs; suppliers; payments and debts; employee advances; dashboard with revenue / cost / profit by area and period; Excel export as backup. Light and dark mode required. Responsive: desktop PC and phones/tablets equally. No customer-facing receipt for now. No stock.

## Brand Commitments

Name: **Car Station Express**. Logo at `public/logo.png`: heavy italic black wordmark "CAR STATION", a red slanted band holding "express" in white italic, a red-and-black speed swoosh and red dots, on an off-white ground. The owner asked that the system's colours follow the logo: red, near-black, off-white.

## Evidence on Hand

Logo only. Article price list pending from Franco. No real customer data yet; any sample data must be labelled as sample.

## Product Principles

1. Logging a job is faster than writing it on paper.
2. Every peso is traceable: cost and sale price frozen per job, profit always visible to the owner.
3. The vehicle is the centre: everything done to a car is in one place.
4. Same tool at the counter and in the workshop; nothing depends on screen size.
