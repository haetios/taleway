'use client'

import Input from "@/components/ui/Input";
import SecondaryButton from "@/components/ui/SecondaryButton";

export default function AuthPage() {

    return (
        <div className="p-10 w-[50%] flex flex-col justify-center">
            <div className="flex flex-col">
                <Input className="mb-5" placeholder="Email" />
                <button className="rounded p-2 bg-primary text-surface">Recevoir un code</button>
            </div>

            <hr className="text-border my-8" />

            <div>
                <SecondaryButton content="Continuer avec Google" icon="logos:google-icon" onClick={() => {}} />
                <SecondaryButton content="Continuer avec Discord" icon="logos:discord-icon" onClick={() => {}} />
            </div>
        </div>
    )
}