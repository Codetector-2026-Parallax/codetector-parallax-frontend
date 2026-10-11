import { Landmark, ShieldAlert, Terminal, AlertTriangle } from "lucide-react"
import landingData from "../../data/landingData.json"
import SectionHeader from "./shared/SectionHeader"
import { getIcon } from "../../lib/iconMap"

function CaseDossier() {
  const {
    sectionNumber,
    sectionTitle,
    heading,
    subheading,
    intro,
    quickFacts,
    crimeScene,
    adversary,
  } = landingData.caseDossier

  return (
    <section id="overview" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-5 sm:py-14 lg:px-8">
      <SectionHeader
        number={sectionNumber}
        title={sectionTitle}
        heading={heading}
        subheading={subheading}
        intro={intro}
      />

      {/* Quick facts */}
      <div className="content-panel mt-7 border-y border-primary/40 px-1 py-4 sm:mt-8 sm:py-5">
        <div className="grid min-w-0 grid-cols-1 gap-4 text-xs sm:grid-cols-3 sm:gap-0">
          {quickFacts.map((fact, index) => (
            <div key={index} className="space-y-1 border-l border-border/50 pl-4 sm:first:border-l-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {fact.label}
              </span>
              <p
                className={`font-semibold sm:text-sm ${
                  fact.alert
                    ? "font-mono font-bold text-destructive"
                    : fact.highlight
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 grid min-w-0 items-stretch gap-6 sm:mt-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        {/* Crime scene */}
        <div className="content-panel min-w-0 rounded-2xl border border-primary/45 p-5 shadow-[0_0_25px_rgba(202,160,82,0.14)] flex flex-col justify-between sm:p-7">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Landmark className="size-5 text-primary" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">{crimeScene.title}</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{crimeScene.badge}</span>
            </div>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-foreground/85">
              {crimeScene.description}
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border/50 bg-background/75 p-4 text-xs">
              {crimeScene.clues.map((clue, index) => {
                const ClueIcon = getIcon(clue.icon)
                return (
                  <div key={index} className="flex items-start gap-2.5">
                    <ClueIcon className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground">{clue.label}:</span>
                      <span className="text-muted-foreground ml-1">{clue.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{crimeScene.status}</span>
            <span className="font-semibold text-primary">{crimeScene.handover}</span>
          </div>
        </div>

        {/* Adversary NULL */}
        <div className="content-panel min-w-0 rounded-2xl border border-destructive/45 p-5 shadow-[0_0_25px_rgba(202,80,60,0.12)] flex flex-col justify-between sm:p-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-5 text-destructive" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">{adversary.title}</h3>
              </div>
              <span className="rounded bg-destructive/15 border border-destructive/40 px-2 py-0.5 text-[9px] font-mono font-bold text-destructive uppercase">
                {adversary.badge}
              </span>
            </div>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-foreground/85">
              {adversary.description}
            </p>

            <div className="mt-5 rounded-xl border border-border/60 bg-background/90 p-4 font-mono text-xs leading-relaxed">
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-2 text-[10px] text-primary/80">
                <span className="flex items-center gap-1.5">
                  <Terminal className="size-3" /> {adversary.sqlSnippet.filename}
                </span>
                <span className="text-[9px] text-destructive">{adversary.sqlSnippet.status}</span>
              </div>
              <p className="text-destructive font-semibold">{adversary.sqlSnippet.comment}</p>
              {adversary.sqlSnippet.lines.map((line, index) => (
                <p key={index} className="text-primary">
                  {line.keyword} <span className="text-foreground">{line.text}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary shrink-0" />
            <span>{adversary.objective}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CaseDossier
