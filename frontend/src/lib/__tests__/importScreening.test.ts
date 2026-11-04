import { describe, it, expect } from "vitest";
import {
  detectFormat,
  parseMedline,
  parseRis,
  parseEndnote,
  parseCsv,
  parseCsvRows,
  parseCitations,
  importCitationText,
  citationsToScreeningItems,
} from "../importScreening";

// ── format detection ─────────────────────────────────────────────────────────

describe("detectFormat", () => {
  it("detects CSV by extension", () => {
    expect(detectFormat("anything", "export.csv")).toBe("csv");
  });

  it("detects RIS by extension (.ris and .nbib)", () => {
    expect(detectFormat("anything", "refs.ris")).toBe("ris");
    expect(detectFormat("anything", "pubmed.nbib")).toBe("ris");
  });

  it("detects MEDLINE by extension", () => {
    expect(detectFormat("anything", "pubmed.medline")).toBe("medline");
  });

  it("detects EndNote by %T tag content", () => {
    expect(detectFormat("%T Some title\n%A Doe, J\n", "refs.txt")).toBe("endnote");
  });

  it("detects RIS by TY tag content", () => {
    expect(detectFormat("TY  - JOUR\nTI  - Title\nER  - \n", "refs.txt")).toBe("ris");
  });

  it("detects MEDLINE by PMID tag content", () => {
    expect(detectFormat("PMID- 12345678\nTI  - A study\n", "pubmed.txt")).toBe("medline");
  });

  it("falls back to CSV for header-ish delimited content", () => {
    expect(detectFormat("Title,Abstract,Year\nFoo,Bar,2020\n", "data.txt")).toBe("csv");
  });

  it("returns unknown for unrecognised content", () => {
    expect(detectFormat("just some prose without tags", "notes.txt")).toBe("unknown");
  });

  it("strips a UTF-8 BOM before sniffing", () => {
    expect(detectFormat("\uFEFFPMID- 1\nTI  - x\n", "pubmed.txt")).toBe("medline");
  });
});

// ── MEDLINE ──────────────────────────────────────────────────────────────────

describe("parseMedline", () => {
  it("parses title + abstract with wrapped continuation lines", () => {
    const text = [
      "PMID- 12345678",
      "TI  - Deep brain stimulation for",
      "      essential tremor: a meta-analysis.",
      "AB  - Background: DBS is effective.",
      "      Methods: We pooled 12 trials.",
      "JT  - Neurosurgery",
      "",
    ].join("\n");
    const recs = parseMedline(text);
    expect(recs).toHaveLength(1);
    expect(recs[0].title).toBe("Deep brain stimulation for essential tremor: a meta-analysis.");
    expect(recs[0].abstract).toBe("Background: DBS is effective. Methods: We pooled 12 trials.");
    expect(recs[0].format).toBe("medline");
  });

  it("parses multiple MEDLINE records with correct separation", () => {
    const text = [
      "PMID- 12345678",
      "TI  - First study title",
      "AB  - First study abstract",
      "",
      "PMID- 87654321",
      "TI  - Second study title",
      "AB  - Second study abstract",
      "",
      "PMID- 11111111",
      "TI  - Third study title",
      "AB  - Third study abstract",
      "",
    ].join("\n");
    const recs = parseMedline(text);
    expect(recs).toHaveLength(3);
    expect(recs[0].title).toBe("First study title");
    expect(recs[0].abstract).toBe("First study abstract");
    expect(recs[1].title).toBe("Second study title");
    expect(recs[1].abstract).toBe("Second study abstract");
    expect(recs[2].title).toBe("Third study title");
    expect(recs[2].abstract).toBe("Third study abstract");
  });

  it("skips untagged blocks", () => {
    const text = "no tags here at all\n\nTI  - Real record\n";
    const recs = parseMedline(text);
    expect(recs).toHaveLength(1);
    expect(recs[0].title).toBe("Real record");
  });

  it("strips inline HTML markup from abstracts", () => {
    const text = "TI  - Study\nAB  - Results were <b>significant</b> (p<0.05).\n";
    const recs = parseMedline(text);
    expect(recs[0].abstract).toBe("Results were significant (p<0.05).");
  });
});

// ── RIS ──────────────────────────────────────────────────────────────────────

describe("parseRis", () => {
  it("parses TI/AB records terminated by ER", () => {
    const text = [
      "TY  - JOUR",
      "TI  - Cranioplasty outcomes",
      "AB  - A systematic review.",
      "ER  - ",
      "",
      "TY  - JOUR",
      "TI  - Second study",
      "N2  - Abstract via N2 tag.",
      "ER  - ",
    ].join("\n");
    const recs = parseRis(text);
    expect(recs).toHaveLength(2);
    expect(recs[0].title).toBe("Cranioplasty outcomes");
    expect(recs[0].abstract).toBe("A systematic review.");
    expect(recs[1].abstract).toBe("Abstract via N2 tag.");
  });

  it("falls back to T1 when TI is absent", () => {
    const text = "TY  - JOUR\nT1  - Title via T1\nER  - \n";
    const recs = parseRis(text);
    expect(recs[0].title).toBe("Title via T1");
  });

  it("flushes a trailing record with no ER terminator", () => {
    const text = "TY  - JOUR\nTI  - No terminator";
    const recs = parseRis(text);
    expect(recs).toHaveLength(1);
    expect(recs[0].title).toBe("No terminator");
  });
});

// ── EndNote ──────────────────────────────────────────────────────────────────

describe("parseEndnote", () => {
  it("parses %T and %X tags", () => {
    const text = "%T Shunt infection rates\n%A Smith J\n%X We reviewed 400 cases.\n\n%T Another paper\n%X Second abstract.\n";
    const recs = parseEndnote(text);
    expect(recs).toHaveLength(2);
    expect(recs[0].title).toBe("Shunt infection rates");
    expect(recs[0].abstract).toBe("We reviewed 400 cases.");
    expect(recs[1].title).toBe("Another paper");
  });
});

// ── CSV ──────────────────────────────────────────────────────────────────────

describe("parseCsvRows", () => {
  it("handles quoted fields with embedded commas and newlines", () => {
    const rows = parseCsvRows('a,"b,c","line1\nline2"\n');
    expect(rows).toEqual([["a", "b,c", "line1\nline2"]]);
  });

  it("handles escaped double quotes", () => {
    const rows = parseCsvRows('a,"say ""hi"""\n');
    expect(rows).toEqual([["a", 'say "hi"']]);
  });

  it("drops fully-empty rows", () => {
    const rows = parseCsvRows("a,b\n\n\nc,d\n");
    expect(rows).toEqual([["a", "b"], ["c", "d"]]);
  });
});

describe("parseCsv", () => {
  it("maps Title/Abstract columns case-insensitively", () => {
    const text = "PMID,Title,Abstract,Year\n1,Study A,Abstract A,2020\n2,Study B,Abstract B,2021\n";
    const recs = parseCsv(text);
    expect(recs).toHaveLength(2);
    expect(recs[0].title).toBe("Study A");
    expect(recs[0].abstract).toBe("Abstract A");
    expect(recs[1].title).toBe("Study B");
  });

  it("sniffs semicolon delimiters", () => {
    const text = "Title;Abstract\nFoo;Bar\n";
    const recs = parseCsv(text);
    expect(recs).toHaveLength(1);
    expect(recs[0].title).toBe("Foo");
    expect(recs[0].abstract).toBe("Bar");
  });

  it("falls back to first two columns when no header matches", () => {
    // Note: row 0 must not contain header-ish words ("title"/"abstract"),
    // otherwise header detection legitimately claims it.
    const text = "Study one,Background one\nStudy two,Background two\n";
    const recs = parseCsv(text);
    expect(recs).toHaveLength(2);
    expect(recs[0].title).toBe("Study one");
    expect(recs[0].abstract).toBe("Background one");
  });
});

// ── dispatch + screening items ───────────────────────────────────────────────

describe("parseCitations / importCitationText", () => {
  it("dispatches to the right parser by detected format", () => {
    const ris = "TY  - JOUR\nTI  - RIS record\nER  - \n";
    expect(parseCitations(ris, "x.ris")[0].format).toBe("ris");

    const medline = "TI  - MEDLINE record\n";
    expect(parseCitations(medline, "x.medline")[0].format).toBe("medline");
  });

  it("unknown format tries structured parsers then CSV", () => {
    const recs = parseCitations("Title,Abstract\nA,B\n", "mystery.bin");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].title).toBe("A");
  });

  it("importCitationText builds screening items with unique ids", () => {
    const text = "TI  - One\n\nTI  - Two\n";
    const res = importCitationText(text, "pubmed.txt");
    expect(res.records).toBe(2);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].id).not.toBe(res.items[1].id);
    expect(res.items[0].decision).toBe("unset");
    expect(res.items[0].stage).toBe("title_abstract");
  });

  it("counts records with neither title nor abstract as skipped", () => {
    const text = "PMID- 1\n\nTI  - Real\n";
    const res = importCitationText(text, "pubmed.txt");
    expect(res.records).toBe(2);
    expect(res.skipped).toBe(1);
  });

  it("derives a title from the abstract head when title is missing", () => {
    const items = citationsToScreeningItems([{ title: "", abstract: "X".repeat(100), format: "medline" }]);
    expect(items[0].title.endsWith("…")).toBe(true);
    expect(items[0].title.length).toBeLessThanOrEqual(62);
  });

  it("labels fully-empty records as Untitled", () => {
    const items = citationsToScreeningItems([{ title: "", abstract: "", format: "ris" }]);
    expect(items[0].title).toBe("Untitled record #1");
  });

  it("parses PubMed Summary format with PMID and DOI", () => {
    const text = "1: Fillingim RB, Loeser JD. Assessment of Chronic Pain. J Pain. 2016. doi: 10.1016/j.jpain.2015.08.010. PMID: 27586827.\n\n2: Hawker GA. Measures of adult pain. Arthritis Care Res. 2011. PMID: 22588748.";
    const res = importCitationText(text, "summary.txt");
    expect(res.format).toBe("pubmed_summary");
    expect(res.records).toBe(2);
    expect(res.items[0].title).toBe("Assessment of Chronic Pain");
    expect(res.items[0].pmid).toBe("27586827");
    expect(res.items[0].doi).toBe("10.1016/j.jpain.2015.08.010");
  });

  it("parses PubMed Abstract text format with title, abstract, and PMID", () => {
    const text = "1. J Pain. 2016.\n\nAssessment of Chronic Pain.\n\nFillingim RB.\n\nAuthor information:\nUniv Florida.\n\nAccurate classification of chronic pain conditions.\n\nDOI: 10.1016/j.jpain.2015.08.010\nPMID: 27586827";
    const res = importCitationText(text, "abstract.txt");
    expect(res.format).toBe("pubmed_abstract");
    expect(res.records).toBe(1);
    expect(res.items[0].title).toBe("Assessment of Chronic Pain");
    expect(res.items[0].abstract).toContain("Accurate classification");
    expect(res.items[0].pmid).toBe("27586827");
  });

  it("parses plain PMID list", () => {
    const text = "27586827\n22588748\n41136120\n";
    const res = importCitationText(text, "pmids.txt");
    expect(res.format).toBe("pmid_list");
    expect(res.records).toBe(3);
    expect(res.items[0].pmid).toBe("27586827");
    expect(res.items[0].title).toBe("PMID 27586827");
  });
});
