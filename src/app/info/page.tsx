"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ExperimentInfoPage() {
    const router = useRouter();

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Logo */}
            <div className="flex justify-center mb-4">
                <Image
                    src="/ashoka_logo.png"
                    alt="Ashoka University Logo"
                    width={200}
                    height={200}
                    className="rounded-md"
                />
            </div>

            <h1 className="text-2xl font-semibold text-center mb-6">
                Learn More about the Study
            </h1>
            <div className="flex flex-col gap-4 px-6">
                {/* Scrollable content box */}
                <div
                    className="max-h-[60vh] overflow-y-auto pr-2 space-y-5 text-foreground border rounded-lg p-6 bg-card shadow-sm whitespace-pre-wrap"
                >
                    <p>
                        Thank you for your interest in taking part in this study. This experiment is being
                        conducted as part of a research project at <strong>Ashoka University</strong> by{" "}
                        Amrit Singh and Vansh Bothra, under the guidance of Professor Sudheendra Hangal.
                    </p>
                    <br />
                    <p>


                        Through this word game, we aim to study cognition. Accordingly, please do not feel
                        pressured to do well in the game. Our goal is not to judge you or your playing skills, but
                        rather to understand how you, and other participants, think, form patterns, recall words
                        and use techniques or strategies to help in these tasks. Participation in this study is
                        entirely voluntary, and you may withdraw from the experiment at any time.
                    </p>
                    <br />
                    <p>
                        Participation in this study entails playing a round of the Wordflower game and answering
                        brief surveys before and after the session. The total duration for playing the game is{" "}
                        <strong>30 minutes</strong>. Since the timer cannot be paused, we recommend that you set
                        aside time accordingly, as breaks in between will not be possible.
                    </p>
                    <br />
                    <p>
                        Data collected will remain private and confidential, and only the research team will have
                        access to your information. No personally identifying information will appear in any
                        publication or presentation.


                        Data collected includes: </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Personal information (Name)</li>
                        <li>Contact information (Email)</li>
                        <li>Demographics (Age and Gender)</li>
                        <li>Background information (Education and Occupation)</li>
                        <li>Linguistic background (Native Language and English Proficiency)</li>
                        <li>Wordflower experience (Frequency of Playing)</li>
                        <li>In-game logging</li>
                        <li>End-game survey on your experience</li>
                    </ul>
                    <br />

                    <p>
                        If you have any questions, feedback, or suggestions, please feel free to reach out to us
                        at amrit.singh_ug25@ashoka.edu.in and/or  vansh.bothra_ug25@ashoka.edu.in.
                    </p>
                    <br />
                    <p>
                        By continuing, you acknowledge that you have read and understood the information above and
                        voluntarily agree to participate in this study.
                    </p>
                </div>

                <div className="pt-6 flex justify-center">
                    <Button
                        onClick={() => {
                            localStorage.setItem("wordflower_consent", "true")
                            router.push("/signup")
                        }
                        }
                        className="w-full sm:w-auto"
                    >
                        I Agree and Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
