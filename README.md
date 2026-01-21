# Risala

Risala is an AI-powered platform for generating official Middle Eastern-style letters. It provides a no-login, pay-per-letter service with a live, editable letter canvas.

## Features

- **Official Letter Generation**: AI-powered generation of formal, institution-ready letters
- **Multi-language Support**: Arabic, English, and Bilingual options with RTL support
- **Live Editing**: ContentEditable letter canvas for real-time editing
- **Customizable Controls**: Purpose, language, and tone selectors
- **ChatGPT-style Interface**: Modern, intuitive prompt input
- **Payment Integration**: Stripe checkout skeleton (ready for final implementation)

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **React 19**
- **shadcn/ui** (maia theme)
- **Tailwind CSS**
- **OpenAI API** (Responses API)
- **Stripe** (skeleton/wireframe)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd risala
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
# OpenAI API Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Configuration (Placeholder - Not Required Yet)
# These will be used when implementing Stripe checkout as the final piece
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
# STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required

- `OPENAI_API_KEY` - Your OpenAI API key for letter generation
  - Get your key from: https://platform.openai.com/api-keys
  - Required for the application to function

### Optional (For Future Stripe Integration)

- `STRIPE_SECRET_KEY` - Stripe secret key (not required yet)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (not required yet)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe key (not required yet)
- `NEXT_PUBLIC_APP_URL` - Base URL for redirects (defaults to http://localhost:3000)

## Usage

1. **Start Drafting**: Click "Generate Letter" button (mock payment for development)
2. **Configure Letter**: Use the controls to set Purpose, Language, and Tone
3. **Describe Your Needs**: Type your requirements in the chat input at the bottom
4. **Edit Directly**: Click and edit the letter content directly in the canvas
5. **Refine**: Continue describing changes to refine your letter

## Project Structure

```
risala/
├── app/
│   ├── api/
│   │   ├── checkout/          # Stripe checkout skeleton
│   │   │   ├── route.ts
│   │   │   └── success/
│   │   │       └── route.ts
│   │   └── letter/
│   │       └── generate/
│   │           └── route.ts   # OpenAI letter generation
│   ├── components/
│   │   ├── LetterCanvas.tsx  # Editable letter canvas
│   │   ├── LetterControls.tsx # Purpose/Language/Tone selectors
│   │   └── ChatInput.tsx     # ChatGPT-style prompt input
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   └── utils.ts              # Utility functions
└── README.md
```

## Stripe Integration Status

The Stripe integration is currently a **skeleton/wireframe**. The API routes are in place with placeholder code and detailed comments indicating where the Stripe SDK integration will go. This will be implemented as the final piece.

Current behavior:
- Mock payment flow for development
- Session ID structure ready for Stripe integration
- Payment verification structure prepared

## Development Notes

- **Payment Flow**: Currently uses mock payment for development. The Stripe skeleton is ready for final implementation.
- **Debouncing**: Chat input uses 500ms debounce to prevent excessive API calls
- **RTL Support**: Full right-to-left support for Arabic content
- **Fonts**: Noto Sans Arabic for Arabic text, Times New Roman for English

## Building for Production

```bash
npm run build
npm start
```

## License

Private project - All rights reserved
