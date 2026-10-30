import Link from "next/link";
import PrimaryButton from "../ui/PrimaryButton";

export default function Header() {
    return(
        <header className="flex justify-between p-4 px-10">
            <div>
                <Link href="/"><h1 className="text-2xl font-bold">Taleway</h1></Link>
            </div>

            <div>
                <PrimaryButton href="/auth" content="Se connecter" />
            </div>
        </header>
    )
}