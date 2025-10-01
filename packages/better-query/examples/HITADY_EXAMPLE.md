# HITADY Platform Example

This example demonstrates how to use **better-query** to build a complete service marketplace platform similar to HITADY, featuring professionals, client testimonials, publications, and communication tools.

## Overview

HITADY is a platform that connects service providers (professionals) with clients, featuring:

- 👨‍🔧 **Professional Profiles** - Service providers with complete contact and business information
- ⭐ **Client Testimonials** - Reviews and ratings to build trust and credibility
- 📱 **Publications** - Multiple content types to showcase work and promote services
- 📞 **Communication** - Direct contact via phone, WhatsApp, and location sharing
- 🔒 **Security** - Ownership control, permission scopes, and input sanitization

## Features Demonstrated

### 1. Professional Profiles

Service providers can create comprehensive profiles with:

- Basic information (name, profession, bio, avatar)
- Category and specializations (mechanic, hairdresser, electrician, etc.)
- Contact details (phone, WhatsApp, location with GPS)
- Business information (services, price range, working hours)
- Reputation metrics (average rating, total reviews, badges)

```typescript
// Create a professional profile
POST /api/query/professional
{
  "name": "Rakoto Andrianina",
  "profession": "Mécanicien automobile",
  "category": "mechanic",
  "phoneNumber": "+261341234567",
  "location": {
    "city": "Antananarivo",
    "address": "Analakely, Rue XYZ"
  },
  "services": ["Réparation embrayage", "Vidange", "Diagnostic électronique"]
}
```

### 2. Client Testimonials

Clients can leave reviews for professionals they've worked with:

- Short text reviews (1-3 sentences, 10-300 characters)
- Star ratings (1-5 stars)
- Optional photos of the work
- Service type information
- Moderation workflow (pending → approved → published)

**Key Features:**
- ✅ Automatic rating calculation for professionals
- ✅ One testimonial per client per professional (spam prevention)
- ✅ Displayed on professional profile and in feed
- ✅ Moderation support for quality control

```typescript
// Leave a testimonial
POST /api/query/testimonial
{
  "professionalId": "prof_123",
  "clientName": "Jean",
  "text": "Rakoto a réparé mon embrayage rapidement et proprement, je recommande !",
  "rating": 5,
  "serviceType": "Réparation embrayage"
}
```

### 3. Publications (Multiple Types)

Professionals can create various types of content:

#### 📸 Work Photos (Photos de réalisations)
Showcase completed work with before/after photos

```typescript
POST /api/query/publication
{
  "professionalId": "prof_123",
  "type": "work_photo",
  "title": "Réparation moteur diesel",
  "description": "Remplacement joint de culasse",
  "beforePhoto": "https://example.com/before.jpg",
  "afterPhoto": "https://example.com/after.jpg"
}
```

#### 🏷️ Temporary Promotions (Promotions temporaires)
Time-limited offers with automatic badge display

```typescript
POST /api/query/publication
{
  "professionalId": "prof_123",
  "type": "temporary_promotion",
  "title": "Promo vidange cette semaine",
  "description": "Vidange complète avec filtre inclus",
  "promotion": {
    "originalPrice": 50000,
    "discountedPrice": 35000,
    "validUntil": "2024-12-31"
  }
}
```

#### 🆕 New Services (Nouveaux services proposés)
Announce new offerings

```typescript
POST /api/query/publication
{
  "professionalId": "prof_123",
  "type": "new_service",
  "title": "Pose de climatiseur split",
  "description": "Installation rapide avec garantie 6 mois",
  "serviceDetails": {
    "serviceName": "Installation climatisation",
    "indicativePrice": 150000
  }
}
```

#### 📰 Story Sharing (Stories éphémères - 24h)
Quick updates that auto-expire after 24 hours

```typescript
POST /api/query/publication
{
  "professionalId": "prof_123",
  "type": "story",
  "title": "Disponible aujourd'hui",
  "description": "Deux créneaux libres cet après-midi pour réparations rapides",
  "photos": ["https://example.com/workshop.jpg"]
}
// Automatically expires after 24 hours
```

### 4. Contact & Communication

Track contact requests with various methods:

- 📞 **Phone Call** - Direct phone contact
- 💬 **WhatsApp** - Pre-filled message generation
- 📍 **Location Share** - GPS coordinates for navigation
- 📅 **Booking Request** - Service appointment scheduling

```typescript
// Contact via WhatsApp with pre-filled message
POST /api/query/contact_request
{
  "professionalId": "prof_123",
  "contactType": "whatsapp",
  "serviceRequested": "Réparation embrayage",
  "message": "Je cherche un mécanicien pour réparer mon embrayage"
}

// Generates URL like:
// https://wa.me/+261341234567?text=Salut%20Rakoto%2C%20j%27ai%20vu%20votre%20profil%20sur%20HITADY...
```

## Security Features

### Ownership-Based Access Control

```typescript
ownership: {
  field: "userId",
  strategy: "flexible" // Allows owners + admins
}
```

### Scope-Based Permissions

```typescript
scopes: {
  create: ["professional:write"],
  read: ["professional:read"],
  update: ["professional:write"],
  delete: ["professional:delete"],
  list: ["professional:read"]
}
```

### Input Sanitization

```typescript
sanitization: {
  global: [
    { type: "trim" },    // Remove whitespace
    { type: "escape" }   // Escape HTML characters
  ],
  fields: {
    description: [{ type: "strip" }], // Remove < and >
    name: [
      {
        type: "custom",
        customFn: (value: string) => value.replace(/[^\w\s-]/g, "")
      }
    ]
  }
}
```

## Lifecycle Hooks & Business Logic

### Automatic Timestamps

```typescript
onCreate: async (context) => {
  context.data.createdAt = new Date();
  context.data.updatedAt = new Date();
  context.data.userId = context.user?.id;
}
```

### Badge Assignment

```typescript
onCreate: async (context) => {
  // Auto-set badge based on type
  if (context.data.type === "temporary_promotion") {
    context.data.badge = "promo";
  } else if (context.data.type === "new_service") {
    context.data.badge = "new";
  }
}
```

### Story Auto-Expiration

```typescript
onCreate: async (context) => {
  // Set expiration for stories (24 hours)
  if (context.data.type === "story" || context.data.isStory) {
    context.data.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
```

### Rating Calculation

```typescript
afterCreate: async (context) => {
  // Update professional's average rating after testimonial creation
  // (Implementation would use helper functions to query and update)
  console.log(`Testimonial created for professional ${context.data.professionalId}`);
}
```

## Data Schema

### Professional Profile

```typescript
{
  id: string (optional)
  userId: string                    // Owner
  name: string
  profession: string
  bio: string (optional)
  avatar: string (optional)
  category: "mechanic" | "hairdresser" | ...
  specializations: string[]
  phoneNumber: string
  whatsappNumber: string (optional)
  location: {
    address: string (optional)
    city: string
    latitude: number (optional)
    longitude: number (optional)
  }
  services: string[]
  priceRange: "low" | "medium" | "high"
  workingHours: { ... }
  averageRating: number (0-5)
  totalReviews: number
  badges: string[]
  isActive: boolean
  isVerified: boolean
  createdAt: date
  updatedAt: date
}
```

### Testimonial

```typescript
{
  id: string (optional)
  professionalId: string
  clientUserId: string
  clientName: string
  text: string (10-300 chars)
  rating: number (1-5)
  photo: string (optional)
  serviceType: string (optional)
  isPublished: boolean
  isFeatured: boolean
  isModerated: boolean
  moderationStatus: "pending" | "approved" | "rejected"
  createdAt: date
  updatedAt: date
}
```

### Publication

```typescript
{
  id: string (optional)
  professionalId: string
  userId: string
  type: "work_photo" | "temporary_promotion" | "new_service" | "testimonial" | "story"
  title: string
  description: string (optional)
  photos: string[]
  beforePhoto: string (optional)
  afterPhoto: string (optional)
  promotion: {
    originalPrice: number
    discountedPrice: number
    discountPercentage: number
    validFrom: date
    validUntil: date
  } (optional)
  serviceDetails: {
    serviceName: string
    indicativePrice: number
    availability: string
  } (optional)
  isStory: boolean
  expiresAt: date (optional)
  viewCount: number
  likeCount: number
  isPublished: boolean
  isFeatured: boolean
  badge: "promo" | "new" | "featured" | "none"
  createdAt: date
  updatedAt: date
}
```

### Contact Request

```typescript
{
  id: string (optional)
  professionalId: string
  clientUserId: string
  contactType: "phone_call" | "whatsapp" | "location_share" | "booking_request"
  message: string (optional)
  serviceRequested: string (optional)
  preferredDate: date (optional)
  status: "pending" | "contacted" | "completed" | "cancelled"
  createdAt: date
  updatedAt: date
}
```

## Usage Examples

### 1. List Top-Rated Mechanics

```typescript
GET /api/query/professional?filters={"category":"mechanic"}&sortBy=averageRating&sortOrder=desc
```

### 2. Get Testimonials for a Professional

```typescript
GET /api/query/testimonial?filters={"professionalId":"prof_123","moderationStatus":"approved"}
```

### 3. List Active Promotions

```typescript
GET /api/query/publication?filters={"type":"temporary_promotion","isPublished":true}
```

### 4. Get Today's Stories

```typescript
GET /api/query/publication?filters={"isStory":true,"expiresAt":{"operator":"gt","value":"2024-01-01"}}
```

## Integration Points

### WhatsApp Integration

Pre-filled message format:
```
Salut [Nom], j'ai vu votre profil sur HITADY.
Je cherche [service] à [localisation].
Êtes-vous disponible ?
```

Generated URL:
```
https://wa.me/+261341234567?text=<encoded_message>
```

### Location/GPS Integration

Use `location.latitude` and `location.longitude` to:
- Display professionals on a map
- Calculate distance from user
- Provide navigation to professional's location

### Calendar Integration

Use `workingHours` and `preferredDate` from contact requests to:
- Show available time slots
- Schedule appointments
- Send calendar invites

## Best Practices

1. **Testimonial Moderation**: Always moderate testimonials before displaying publicly to prevent spam and abuse
2. **Story Cleanup**: Implement a background job to delete expired stories
3. **Rating Recalculation**: Update professional ratings asynchronously to avoid performance issues
4. **Image Optimization**: Compress and resize photos before storing
5. **Contact Tracking**: Log all contact attempts for analytics and follow-up
6. **Spam Prevention**: Limit testimonials to one per client per professional
7. **Badge Management**: Regularly update badges based on performance metrics

## Running the Example

To use this example in your application:

```typescript
import { adiemus } from "better-query";
import { hitadyResources } from "./examples/hitady-platform-example";

const query = adiemus({
  resources: hitadyResources,
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL
  }
});

// Use with your framework
app.use("/api/query", query.handler);
```

## Next Steps

1. **Frontend Integration**: Build UI components for each feature
2. **Real-time Updates**: Add WebSocket support for instant notifications
3. **Search**: Implement full-text search for professionals and services
4. **Analytics**: Track views, contacts, and conversion rates
5. **Mobile App**: Create native mobile apps with React Native
6. **Payment Integration**: Add payment processing for bookings

## License

This example is part of the better-query package and follows the same license.
