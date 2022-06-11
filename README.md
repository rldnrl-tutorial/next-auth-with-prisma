# Next-Auth with Prisma

### 1. 먼저 필요한 패키지를 설치해줍시다.

```sh
yarn add next-auth @next-auth/prisma-adapter @prisma/client next-auth
```

```sh
yarn add @types/next-auth prisma -D
```

### 2. Primsa를 세팅해봅시다.

```sh
yarn prisma init
```

이후 `.env` 파일이 생겼는지 확인해주세요.

```
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB (Preview).
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="DATABASE_NAME://DB_USERNAME:DB_PASSWORD@localhost:DB_PORT/DB_NAME"
```

그리고 `prisma` 폴더가 생겼는지 확인해보세요. 내부에는 `schema.prisma` 파일이 들어있습니다.

### 3. `schema.prisma` 파일의 내용을 작성해봅시다.(이 schema는 Next-Auth v4에 적용됩니다.)

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}
```

### 4. DB에 반영해줍니다.

```sh
yarn prisma migrate dev
```

### 5. `@prisma/client`에서 사용하기 위해 다음 명령어를 입력해줍니다.

```sh
yarn prisma generate
```

### 6. Github에 들어가서 OAuth를 위한 토큰을 생성해줍니다.

```
Settings > Developer settings > OAuth App
```

Authorization callback URL는 `{server}/api/auth/callback/{provider}`을 입력해주세요.

<br />

**ex. Github OAuth**

```
http://localhost:3000/api/auth/callback/github
```

Github Client ID와 Github Client Secret를 `.env` 파일에 넣어줍니다.

```
SECRET=RANDOM_STRING
GITHUB_SECRET=
GITHUB_ID=
```

### 7. `pages/api/auth/[...nextauth].ts` 파일을 생성해줍니다.

```ts
import { NextApiHandler } from 'next'
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const options = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.SECRET,
}

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options)

export default authHandler
```

### 8. `pages/_app.tsx`에 `SessionProvider`로 감싸줍니다.

```tsx
// pages/_app.tsx

import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default MyApp
```

### 9. Demo Page에서 확인해봅시다.

```tsx
// pages/index.tsx

import { signIn, signOut, useSession } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <>
      {session ? (
        <>
          <div>Hello {session?.user?.name}</div>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <>
          <div>You are not logged in</div>
          <button onClick={() => signIn()}>Sign In</button>
        </>
      )}
    </>
  )
}
```
