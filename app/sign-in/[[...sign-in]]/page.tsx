import { SignIn } from "@clerk/nextjs"
import { enUS } from '@clerk/localizations'

export default function SignInPage() {
    return (
        <div className="flex justify-center items-center min-h-screen p-5">
            <SignIn />
        </div>
    )
}