import Image from "next/image";
import Link from "next/link";

export default function DataSafetyPolicyPage() {
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
                Data Safety Policy
            </h1>

            <div className="border rounded-lg p-6 bg-card shadow-sm space-y-6 text-foreground">
                <p>
                    We take your privacy seriously. This page explains how we handle the data collected
                    during the TRACE Research Project.
                </p>

                <section>
                    <h2 className="text-lg font-semibold mb-2">What data do we collect?</h2>
                    <p>
                        We collect only what is needed for the study: your email address (for signup purposes),
                        basic demographics (age, gender, education, occupation), language background, and your
                        in-game activity during the session.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">How is your data kept private?</h2>
                    <p>
                        Each participant is assigned a unique identifier upon registration. All gameplay logs and
                        behavioral data are stored using this ID rather than personal details like your email. This
                        means your in-game activity is not directly tied to your identity during analysis.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">Who has access?</h2>
                    <p>
                        Only the three researchers directly involved in this study — Amrit Singh, Vansh Bothra, and
                        Professor Sudheendra Hangal — have access to the database. Your data will not be shared with
                        any third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">How is your data stored?</h2>
                    <p>
                        Data is stored securely on MongoDB Atlas, a cloud platform with enterprise-level security
                        including encryption in transit and at rest. You can read more about their security
                        practices in the{" "}
                        <a
                            href="https://www.mongodb.com/legal/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-primary"
                        >
                            MongoDB Privacy Policy
                        </a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">How is data used in publications?</h2>
                    <p>
                        Any research outputs, presentations, or publications will use only de-identified, aggregated
                        data. No personally identifying information will appear in any dissemination of findings.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">Can I request my data be deleted?</h2>
                    <p>
                        Yes. If you would like your data removed, please contact us at{" "}
                        <a href="mailto:amrit.singh_ug25@ashoka.edu.in" className="underline text-primary">
                            amrit.singh_ug25@ashoka.edu.in
                        </a>{" "}
                        or{" "}
                        <a href="mailto:vansh.bothra_ug25@ashoka.edu.in" className="underline text-primary">
                            vansh.bothra_ug25@ashoka.edu.in
                        </a>.
                        Your signup information and associated gameplay logs will be permanently
                        removed from the database.
                    </p>
                </section>

                <div className="pt-4 text-center">
                    <Link href="/info" className="underline text-primary text-sm">
                        Back to Study Information
                    </Link>
                </div>
            </div>
        </div>
    );
}
