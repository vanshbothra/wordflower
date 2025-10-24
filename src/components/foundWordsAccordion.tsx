import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { CheckCircle2 } from "lucide-react"
import { FoundWordsListProps } from "./found-words-list"
import { Card } from "./ui/card"

export default function FoundWordsAccordion({ foundWords, totalWords }: FoundWordsListProps) {
    // tune this depending on how many fit in a single row
    const visibleCount = 6
    const visibleWords = foundWords.slice(0, visibleCount)
    const hiddenWords = foundWords.slice(visibleCount)

    return (
         <Card className="p-2">
        <Accordion type="single" collapsible defaultValue="words" >
            <AccordionItem value="words">
                {/* Header: only shows title */}
                <AccordionTrigger className="text-base font-medium justify-center">
                    <div className="flex items-center justify-start w-full gap-2">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            Found Words
                        </h3>
                        <div className="text-sm font-medium text-muted-foreground">
                            {foundWords.length} / {totalWords}
                        </div>
                    </div>
                </AccordionTrigger>

                {/* Content: first row always visible, rest appear when expanded */}
                <AccordionContent >
                        <div className="max-h-32 overflow-y-auto flex flex-wrap gap-2">
                            {foundWords.map((word, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 text-muted-foreground"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        </Card>
    )
}
