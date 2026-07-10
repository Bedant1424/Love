# LeadFlow Proposal
## 11_PRODUCT_REFERENCE.md

---

# Purpose

This document serves as the definitive product reference for LeadFlow.

Unlike the other markdown files, this document does not define proposal design, writing, or visuals.

Instead, it defines **the product itself**.

Every proposal page, UI mockup, diagram, illustration, workflow, and feature description must align with this document.

This document is the single source of truth for what LeadFlow currently is, what it includes, what it does not include, and how it operates.

If another document conflicts with this file regarding product functionality, this document takes precedence.

---

# Product Overview

## Product Name

LeadFlow

---

## Category

Recruitment Operations Platform

---

## Product Positioning

LeadFlow is a cloud-based Recruitment Operations Platform designed to help organizations manage recruitment teams through one centralized workspace.

It replaces spreadsheets, scattered WhatsApp conversations, and manual reporting with a structured recruitment workflow that improves visibility, accountability, and operational efficiency.

LeadFlow is designed as a Progressive Web Application (PWA), providing a native-like experience on desktop, tablet, and mobile without requiring installation from an app store.

---

# Vision

Build the operating system for recruitment teams by simplifying lead management, communication, reporting, and performance tracking through one unified platform.

---

# Mission

Help organizations recruit more efficiently by reducing manual work, improving visibility, and giving managers complete control over recruitment operations.

---

# Target Users

## Manager

Responsible for:

- Importing leads
- Creating recruitment batches
- Assigning leads to interns
- Monitoring recruitment progress
- Viewing analytics
- Reviewing reports
- Managing interns
- Managing system settings

---

## Intern

Responsible for:

- Viewing assigned leads
- Calling candidates
- Opening WhatsApp conversations
- Updating call status
- Updating application progress
- Recording notes
- Completing recruitment activities
- Generating daily reports

---

# Core Workflow

The expected recruitment workflow is:

```
Import Leads

↓

Create Batch

↓

Assign Leads

↓

Intern Receives Assigned Leads

↓

Call Candidate

↓

Open WhatsApp (if required)

↓

Update Call Status

↓

Update Application Progress

↓

Add Notes

↓

Manager Reviews Progress

↓

Generate Reports

↓

Analytics Dashboard
```

This workflow forms the backbone of the platform.

---

# Core Modules

LeadFlow consists of the following primary modules.

## Authentication

Secure user login with role-based access.

Roles:

- Manager
- Intern

---

## Manager Dashboard

Provides a centralized overview of recruitment operations.

Includes:

- KPIs
- Team performance
- Batch overview
- Lead statistics
- Daily activity
- Reports
- Analytics

---

## Intern Dashboard

Primary daily workspace.

Includes:

- Assigned leads
- Call actions
- WhatsApp actions
- Status updates
- Notes
- Progress tracking

---

## Lead Management

Manage all recruitment leads in one place.

Capabilities:

- Search
- Filters
- Bulk selection
- Bulk updates
- Assignment
- Sorting

---

## Batch Management

Organize recruitment campaigns into batches.

Purpose:

- Daily lead allocation
- Reporting
- Historical tracking
- Performance measurement

---

## Reporting

Generate recruitment summaries including:

- Daily reports
- Status summaries
- Activity summaries
- Export-ready reports

---

## Analytics

Provide managers with recruitment insights.

Includes:

- KPIs
- Lead conversion
- Activity trends
- Team performance
- Batch performance

---

# Current Features (Included)

The following features are considered part of the current LeadFlow platform.

## User Management

- Login
- Role-based access
- Manager approval
- User profiles

---

## Lead Management

- Lead table
- Search
- Filters
- Bulk selection
- Bulk updates
- Sorting

---

## Recruitment Actions

- Call button
- WhatsApp button
- Call status
- Application progress
- Notes

---

## Batch Management

- Create batches
- Select batches
- Archive batches
- Batch summaries

---

## Reporting

- Daily report
- Image report
- Export-ready summaries

---

## Analytics

- Dashboard KPIs
- Performance tracking
- Recruitment overview

---

## Platform

- Progressive Web App
- Responsive design
- Desktop support
- Mobile support

---

## Storage

- Cloud database
- Local offline mode
- Automatic synchronization

---

# WhatsApp Scope

Current implementation includes:

- One-click WhatsApp conversation launch using the standard `wa.me` URL scheme.

The system opens WhatsApp or WhatsApp Web with the selected candidate.

The platform does **not** currently include:

- WhatsApp Business API
- Automated messaging
- Scheduled messages
- Chatbots
- Message templates
- Delivery tracking

These capabilities belong to future development phases.

---

# Calling Scope

Current implementation includes:

- One-click phone dialing using the device's native dialer (`tel:` links).

LeadFlow does not record calls or provide VoIP functionality.

---

# Business Rules

The platform follows these operational rules.

- Each lead belongs to one batch.
- Each lead is assigned to one intern at a time.
- Managers may reassign leads.
- Managers have visibility across all batches.
- Interns only see their assigned leads.
- Every lead maintains a recruitment history.
- Reports are generated from recruitment activity.
- Completed leads remain available for reporting and historical reference.

---

# Data Structure

Core entities include:

- Users
- Managers
- Interns
- Leads
- Batches
- Notes
- Reports
- Activity Logs

These entities support the recruitment workflow without unnecessary complexity.

---

# Technology Stack

Frontend

- React
- TypeScript

Backend

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Hosting

- Vercel

Platform

- Progressive Web App (PWA)

---

# Performance Goals

LeadFlow should provide:

- Fast page loading
- Responsive interactions
- Reliable synchronization
- Mobile-friendly experience
- Stable cloud storage
- Offline resilience

---

# Current Scope

The current proposal includes:

- Recruitment management
- Lead assignment
- Batch management
- Manager dashboard
- Intern dashboard
- Analytics
- Reporting
- WhatsApp launch
- Phone dialing
- Cloud synchronization
- Progressive Web App
- Deployment
- User onboarding

---

# Future Roadmap

Future versions may include:

- WhatsApp Business API
- Email integration
- AI-assisted recruitment
- Smart lead assignment
- Automated reminders
- Candidate portal
- Attendance tracking
- Multi-organization support
- Branch management
- Calendar integration
- Notification center
- Third-party integrations

These features are **not included** in the current proposal.

---

# Out of Scope

The following are intentionally excluded from the current project:

- Native Android application
- Native iOS application
- WhatsApp Business API
- Automated messaging
- Email automation
- AI recruitment assistant
- Payroll
- HRMS functionality
- Interview scheduling
- Video interviews
- Resume parsing
- Payment gateways
- Multi-tenant SaaS architecture
- Public API
- Third-party CRM integrations

These may be proposed as future enhancements.

---

# Product Principles

LeadFlow is built around the following principles:

- Simplicity over complexity
- Visibility over manual coordination
- Accountability over assumptions
- Speed over unnecessary processes
- Consistency across devices
- Professional user experience
- Scalable architecture
- Business-first thinking

Every design and product decision should reinforce these principles.

---

# Success Criteria

The product is considered successful when:

- Managers can oversee recruitment from one dashboard.
- Interns can complete recruitment tasks efficiently.
- Manual reporting is significantly reduced.
- Lead ownership is always clear.
- Recruitment progress is measurable.
- Daily operations become organized and transparent.

---

# Single Source of Truth

This document defines the current LeadFlow product.

All proposal pages, UI mockups, diagrams, workflows, and feature descriptions must remain consistent with this document.

Do not invent features beyond the defined scope.

Do not promise roadmap items as current functionality.

Maintain a clear distinction between **current capabilities** and **future enhancements** throughout the proposal.
