"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InfoPage() {
    const router = useRouter();
    const [showConsent, setShowConsent] = useState(false);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
            <div className="max-w-2xl w-full">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/ashoka_logo.png"
                        alt="Ashoka University Logo"
                        width={180}
                        height={180}
                        className="rounded-md"
                    />
                </div>

                {!showConsent ? (
                    /* Landing view */
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">TRACE Research Project</h1>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest">
                                Tracing Retrieval And Cognitive Exploration
                            </p>
                        </div>

                        <p className="text-muted-foreground text-base leading-relaxed">
                            A research study conducted at{" "}
                            <strong className="text-foreground">Ashoka University</strong> by Amrit Singh
                            and Vansh Bothra, under the guidance of Professor Sudheendra Hangal.
                        </p>

                        <p className="text-muted-foreground text-base leading-relaxed">
                            We are studying how people find and recall words — specifically how patterns,
                            strategies, and short breaks affect performance in word puzzles. The session
                            takes around <strong className="text-foreground">30 minutes</strong> and
                            involves playing a word game followed by a brief survey. Participation is
                            entirely voluntary.
                        </p>

                        <div className="pt-4">
                            <Button
                                size="lg"
                                className="px-10"
                                onClick={() => setShowConsent(true)}
                            >
                                Register to Participate
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Already registered?{" "}
                            <button
                                onClick={() => router.push("/signin")}
                                className="underline hover:text-foreground transition-colors"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                ) : (
                    /* Consent form view */
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-semibold text-center">Informed Consent</h2>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5 text-foreground border rounded-lg p-6 bg-card shadow-sm">
                            <p>
                                Thank you for your interest in taking part in this study. This experiment is being
                                conducted as part of a research project at{" "}
                                <strong>Ashoka University</strong> by Amrit Singh and Vansh Bothra, under the
                                guidance of Professor Sudheendra Hangal.
                            </p>
                            <p>
                                Through this word game, we aim to study cognition. Our goal is not to judge you
                                or your playing skills, but rather to understand how people form patterns, recall
                                words and use techniques or strategies to help in these tasks. Participation in
                                this study is entirely voluntary, and you may withdraw from the experiment at any
                                time. Please do not feel pressured to do well in the game.
                            </p>
                            <p>
                                This study involves minimal risk and poses no harm of any kind to participants.
                                You will not be exposed to any distressing, deceptive, or physically demanding
                                tasks. The activity consists solely of the word game and the condition you are
                                assigned, and you are free to stop at any point without any consequence.
                            </p>
                            <p>
                                You will now play a round of the Wordflower game.{" "}
                                <strong>
                                    Please play this game on your own and do not use any external resources.
                                </strong>{" "}
                                Please answer brief surveys before and after the session. The total duration for
                                playing the game is <strong>30 minutes</strong>. You will be randomly assigned to
                                one of two game versions — one may offer hints when you appear to be stuck, while
                                the other may briefly redirect you to a short visual task. Both versions are
                                designed to be non-disruptive and are a core part of the study.
                            </p>
                            <p>
                                Data collected will remain private and confidential, and only the research team
                                will have access to your information. No personally identifying information will
                                appear in any publication or presentation. For more details on how your data is
                                collected, stored, and protected, please review our{" "}
                                <a href="/data-safety-policy" className="underline text-primary">
                                    Data Privacy Policy
                                </a>
                                . Data collected includes:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Signup information (Email)</li>
                                <li>Demographics (Age and Gender)</li>
                                <li>Background information (Education and Occupation)</li>
                                <li>Linguistic background (Native Language and English Proficiency)</li>
                                <li>Wordflower experience (Frequency of Playing)</li>
                                <li>In-game logging</li>
                                <li>End-game survey on your experience</li>
                            </ul>
                            <p>
                                If you have any questions, feedback, or suggestions, please feel free to reach
                                out to us at amrit.singh_ug25@ashoka.edu.in and/or
                                vansh.bothra_ug25@ashoka.edu.in.
                            </p>
                            <p>
                                By continuing, you acknowledge that you have read and understood the information
                                above and voluntarily agree to participate in this study.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowConsent(false)}
                                className="w-full sm:w-auto"
                            >
                                I Disagree
                            </Button>
                            <Button
                                onClick={() => {
                                    document.cookie = "wordflower_consent=true; path=/; max-age=31536000";
                                    router.push("/signup");
                                }}
                                className="w-full sm:w-auto"
                            >
                                I Agree and Continue
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
