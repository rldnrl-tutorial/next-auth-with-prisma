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
