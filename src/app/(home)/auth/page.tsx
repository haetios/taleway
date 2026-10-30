'use client'

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import { useState } from "react";

export default function AuthPage() {
    const [isCodeSent, setIsCodeSent] = useState<boolean>(false)
    const [email, setEmail] = useState<string>("")
    const [code, setCode] = useState<string>("")

    // --- FUNCTIONS ---

    const sendCode = async () => {

    }

    const verifyCode = async () => {

    }

    const authWithProvider = (provider: string) => {

    }

    // --- RENDER ---

    return (
        <div className="p-10">
            <div className="space-y-2 mb-10">
                <h2 className="font-bold text-3xl">Prépare-toi pour <span className="text-primary">l'aventure</span> ?</h2>
                <p>
                    Découvre des histoires dans lesquelles tes choix comptent vraiment.<br />
                    Envie de créer ton propre univers ? Alors notre studio de création est fait pour toi !
                </p>
            </div>

            <div className="w-[50%] flex flex-col justify-center space-y-6">
                {isCodeSent ? (
                    <div>
                        <div className="space-y-2">
                            <Input className="w-100" placeholder="Code de vérification" onChange={(event) => setCode(event.target.value)} />
                            <Button
                                className="w-100"
                                type="primary"
                                content="Me connecter"
                                onClick={() => setIsCodeSent(true)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Input className="w-100" placeholder="Email" onChange={(event) => setEmail(event.target.value)} />
                        <Button
                            className="w-100"
                            type="primary"
                            content="Recevoir mon code"
                            onClick={() => setIsCodeSent(true)}
                        />
                    </div>
                )}

                <Divider label="OU" className="w-80" />

                <div className="space-y-2">
                    <Button className="w-100" type="secondary" content="Continuer avec Google" icon="logos:google-icon" onClick={() => authWithProvider('google')} />
                    <Button className="w-100" type="secondary" content="Continuer avec Discord" icon="logos:discord-icon" iconSize={14} onClick={() => authWithProvider('discord')} />
                </div>
            </div>
        </div>
    )
}