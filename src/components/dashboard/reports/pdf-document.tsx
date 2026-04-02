import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#FFFFFF",
    color: "#1A0B2E",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "1.5px solid #E5E5E5",
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#3333FF",
  },
  reportMeta: {
    textAlign: "right",
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1A0B2E",
    marginBottom: 2,
  },
  reportPeriod: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
  },
  statLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1A0B2E",
  },
  // Month section
  monthSection: {
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A0B2E",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  monthTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  monthTotal: {
    fontSize: 9,
    color: "#D1D5DB",
  },
  // Project sub-header
  projectSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 6,
    marginBottom: 2,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  projectSubName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1A0B2E",
    flex: 1,
  },
  projectSubTotal: {
    fontSize: 8,
    color: "#6B7280",
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottom: "0.5px solid #F3F4F6",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FAFAFA",
    borderBottom: "0.5px solid #F3F4F6",
  },
  colDate: { width: 65 },
  colDescription: { flex: 1 },
  colTask: { width: 80 },
  colHours: { width: 55, textAlign: "right" },
  colEarnings: { width: 65, textAlign: "right" },
  headerText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  cellText: {
    fontSize: 8,
    color: "#1A0B2E",
  },
  cellTextMuted: {
    fontSize: 8,
    color: "#6B7280",
  },
  cellTextSmall: {
    fontSize: 7,
    color: "#9CA3AF",
  },
  earningsText: {
    fontSize: 8,
    color: "#00D68F",
    fontFamily: "Helvetica-Bold",
  },
  // Total row
  totalRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTop: "1px solid #E5E5E5",
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
    marginTop: 2,
  },
  totalText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1A0B2E",
  },
  totalEarnings: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#00D68F",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5px solid #E5E5E5",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
});

function formatSecs(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatEur(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

function entryDuration(entry: any): number {
  const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
  return Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
}

interface PDFReportProps {
  entries: any[];
  periodLabel: string;
  generatedAt: string;
  projectLabel?: string;
}

export function PDFReport({ entries, periodLabel, generatedAt, projectLabel }: PDFReportProps) {
  // Group by month → project → entries
  const monthMap: Record<string, Record<string, {
    name: string;
    color: string;
    seconds: number;
    earnings: number;
    entries: any[];
  }>> = {};

  for (const entry of entries) {
    const monthKey = entry.started_at.substring(0, 7);
    const projectKey = entry.project_id || "__none__";
    const projectName = entry.projects?.name || "Sans projet";
    const seconds = entryDuration(entry);
    const rate = entry.hourly_rate ?? entry.tasks?.hourly_rate ?? 0;
    const earnings = rate ? (seconds / 3600) * rate : 0;

    if (!monthMap[monthKey]) monthMap[monthKey] = {};
    if (!monthMap[monthKey][projectKey]) {
      monthMap[monthKey][projectKey] = {
        name: projectName,
        color: entry.projects?.color || "#9CA3AF",
        seconds: 0,
        earnings: 0,
        entries: [],
      };
    }
    monthMap[monthKey][projectKey].seconds += seconds;
    monthMap[monthKey][projectKey].earnings += earnings;
    monthMap[monthKey][projectKey].entries.push({
      ...entry,
      _duration: seconds,
      _earnings: earnings,
    });
  }

  const months = Object.keys(monthMap).sort();

  // Grand totals
  const totalSeconds = entries.reduce((acc, e) => acc + entryDuration(e), 0);
  const totalEarnings = entries.reduce((acc, e) => {
    const rate = e.hourly_rate ?? e.tasks?.hourly_rate ?? 0;
    return acc + (rate ? (entryDuration(e) / 3600) * rate : 0);
  }, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>TrackHour</Text>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>Rapport d&apos;activité</Text>
            {projectLabel && <Text style={styles.reportPeriod}>Projet : {projectLabel}</Text>}
            <Text style={styles.reportPeriod}>{periodLabel}</Text>
            <Text style={styles.reportPeriod}>Généré le {generatedAt}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Heures totales</Text>
            <Text style={styles.statValue}>{formatSecs(totalSeconds)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenus générés</Text>
            <Text style={styles.statValue}>{formatEur(totalEarnings)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Entrées</Text>
            <Text style={styles.statValue}>{entries.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mois</Text>
            <Text style={styles.statValue}>{months.length}</Text>
          </View>
        </View>

        {/* Monthly breakdowns with detailed entries */}
        {months.map((monthKey) => {
          const projects = Object.values(monthMap[monthKey]).sort((a, b) => b.seconds - a.seconds);
          const monthSeconds = projects.reduce((acc, p) => acc + p.seconds, 0);
          const monthEarnings = projects.reduce((acc, p) => acc + p.earnings, 0);
          const monthLabel = format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: fr });

          return (
            <View key={monthKey} style={styles.monthSection}>
              {/* Month header */}
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{monthLabel}</Text>
                <Text style={styles.monthTotal}>
                  {formatSecs(monthSeconds)}{monthEarnings > 0 ? `  ·  ${formatEur(monthEarnings)}` : ""}
                </Text>
              </View>

              {/* Projects with their entries */}
              {projects.map((p) => {
                const sortedEntries = [...p.entries].sort(
                  (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
                );

                return (
                  <View key={p.name} wrap={false}>
                    {/* Project sub-header */}
                    <View style={styles.projectSubHeader}>
                      <View style={[styles.projectDot, { backgroundColor: p.color }]} />
                      <Text style={styles.projectSubName}>{p.name}</Text>
                      <Text style={styles.projectSubTotal}>
                        {sortedEntries.length} entrée{sortedEntries.length > 1 ? "s" : ""} · {formatSecs(p.seconds)}
                        {p.earnings > 0 ? ` · ${formatEur(p.earnings)}` : ""}
                      </Text>
                    </View>

                    {/* Column headers */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerText, styles.colDate]}>Date</Text>
                      <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
                      <Text style={[styles.headerText, styles.colTask]}>Tâche</Text>
                      <Text style={[styles.headerText, styles.colHours]}>Durée</Text>
                      <Text style={[styles.headerText, styles.colEarnings]}>Montant</Text>
                    </View>

                    {/* Entry rows */}
                    {sortedEntries.map((entry: any, i: number) => (
                      <View key={entry.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                        <View style={styles.colDate}>
                          <Text style={styles.cellText}>
                            {format(parseISO(entry.started_at), "dd/MM/yyyy", { locale: fr })}
                          </Text>
                          <Text style={styles.cellTextSmall}>
                            {format(parseISO(entry.started_at), "HH:mm")} – {format(parseISO(entry.ended_at), "HH:mm")}
                          </Text>
                        </View>
                        <Text style={[styles.cellText, styles.colDescription]}>
                          {entry.description || "—"}
                        </Text>
                        <Text style={[styles.cellTextMuted, styles.colTask]}>
                          {entry.tasks?.name || "—"}
                        </Text>
                        <Text style={[styles.cellText, styles.colHours]}>
                          {formatSecs(entry._duration)}
                        </Text>
                        <Text style={[entry._earnings > 0 ? styles.earningsText : styles.cellTextMuted, styles.colEarnings]}>
                          {entry._earnings > 0 ? formatEur(entry._earnings) : "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}

              {/* Month total row */}
              <View style={styles.totalRow}>
                <Text style={[styles.totalText, { flex: 1 }]}>Total {monthLabel}</Text>
                <Text style={[styles.totalText, styles.colHours]}>{formatSecs(monthSeconds)}</Text>
                <Text style={[monthEarnings > 0 ? styles.totalEarnings : styles.totalText, styles.colEarnings]}>
                  {monthEarnings > 0 ? formatEur(monthEarnings) : "—"}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Grand total */}
        {months.length > 1 && (
          <View style={[styles.totalRow, { marginTop: 8, borderTop: "2px solid #1A0B2E" }]}>
            <Text style={[styles.totalText, { flex: 1, fontSize: 10 }]}>Total général</Text>
            <Text style={[styles.totalText, styles.colHours, { fontSize: 10 }]}>{formatSecs(totalSeconds)}</Text>
            <Text style={[totalEarnings > 0 ? styles.totalEarnings : styles.totalText, styles.colEarnings, { fontSize: 10 }]}>
              {totalEarnings > 0 ? formatEur(totalEarnings) : "—"}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>TrackHour — rapport confidentiel</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
