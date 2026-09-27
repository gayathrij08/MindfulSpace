# MindfulSpace – AI-Powered Mental Wellness Platform

MindfulSpace is an AI-powered mental wellness platform designed to provide **first-level emotional support**, mood tracking, mental wellness resources, and emergency support features in a secure and user-friendly environment.

The platform combines AI-powered conversations, mood analysis, mental health assessments, trusted-contact alerts, journaling, wellness exercises, and appointment support in one application.

> **Note:** MindfulSpace is designed as a mental-wellness support platform and is not a replacement for professional medical or psychological care.

---

## 🌱 Key Features

### 🤖 AI Mental Wellness Companion
- AI-powered conversational support using Google Gemini.
- Provides first-level emotional support.
- Uses conversation history and user profile information to provide contextual responses.
- Supports multilingual interaction.

### 😊 Mood Tracking & Analysis
- Users can record and monitor their moods.
- Mood analysis incorporates:
  - Language patterns
  - Typing speed
  - Response time
- Mood scores are represented on a 1–10 scale.
- Historical mood information can be viewed through the platform.

### 🧠 Mental Health Assessments
- PHQ-9 assessment support.
- GAD-7 assessment support.
- Mental wellness reports based on assessment responses.
- Designed to help users understand their reported symptoms and track changes over time.

### 🚨 Emergency Support
- Detects predefined high-risk phrases and indicators.
- Activates a safety-support workflow when high-risk indicators are detected.
- Sends emergency notifications to a registered trusted contact.
- Supports SMS and email notifications.
- Maintains emergency/crisis event records.

### 👥 Trusted Contact
- Users can register a trusted contact.
- Trusted contacts have a separate dashboard.
- Emergency alerts can be sent to the registered trusted contact.
- Consent is required for emergency-contact functionality.

### 📔 Wellness Activities
The platform provides resources and activities such as:
- Breathing exercises
- Journaling
- Wellness exercises
- Music/resources
- Mental wellness guides
- Educational resources

### 📅 Appointment Support
- Appointment-related functionality.
- Users can manage appointment information through the platform.

### 🔐 Authentication & User Profiles
- Google Sign-In / Firebase Authentication.
- User profile setup.
- Personality assessment/profile information.
- Protected user functionality.
- Trusted-contact management.

---

## 🏗️ System Flow

```text
                    ┌──────────────────┐
                    │     User         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Authentication   │
                    │ Firebase Auth    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Profile Setup    │
                    │ & Assessment     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌────────────────────────┐
                    │      Dashboard         │
                    └───────────┬────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
       ┌───────────┐      ┌────────────┐     ┌─────────────┐
       │ AI Chat   │      │ Mood       │     │ Mental      │
       │ Support   │      │ Tracking   │     │ Assessment  │
       └─────┬─────┘      └─────┬──────┘     └──────┬──────┘
             │                  │                   │
             └──────────────────┼───────────────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Safety Support      │
                     │ & Emergency Alerts  │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Trusted Contact     │
                     └─────────────────────┘
