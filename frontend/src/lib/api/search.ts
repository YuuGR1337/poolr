// External database search functions (PubMed, OpenAlex, Crossref, ClinicalTrials.gov, etc.)
import { postJson } from "./client";


export interface SearchResult {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  abstract: string;
  doi?: string;
  pmid?: string;
  url?: string;
  database: string;
}

export interface SearchResponse {
  query: string;
  database: string;
  totalResults: number;
  results: SearchResult[];
}

export async function pubmedSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  try {
    return await postJson<SearchResponse>("/api/search/pubmed", { query, apiKey }, 5000);
  } catch {
    try {
      const eSearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=20${apiKey ? `&api_key=${apiKey}` : ""}`;
      const searchRes = await fetch(eSearchUrl);
      if (!searchRes.ok) throw new Error(`PubMed search error: ${searchRes.statusText}`);
      const searchData = await searchRes.json();
      const idList: string[] = searchData?.esearchresult?.idlist || [];
      const totalResults = parseInt(searchData?.esearchresult?.count || "0", 10);
      if (idList.length === 0) return { query, database: "PubMed", totalResults: 0, results: [] };

      const eSummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(",")}&retmode=json${apiKey ? `&api_key=${apiKey}` : ""}`;
      const sumRes = await fetch(eSummaryUrl);
      if (!sumRes.ok) throw new Error(`PubMed summary error: ${sumRes.statusText}`);
      const sumData = await sumRes.json();
      const uids: string[] = sumData?.result?.uids || [];
      const results: SearchResult[] = uids.map((pmid) => {
        const item = sumData.result[pmid] || {};
        const authors = (item.authors || []).map((a: any) => a.name).join(", ");
        const year = parseInt(item.pubdate?.slice(0, 4), 10) || new Date().getFullYear();
        const doiObj = (item.articleids || []).find((id: any) => id.idtype === "doi");
        return {
          id: `pubmed-${pmid}`, title: item.title?.replace(/<\/?b>/g, "") || "Untitled",
          authors: authors || "Unknown authors", year, source: item.source || "PubMed",
          abstract: "", doi: doiObj?.value, pmid,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, database: "PubMed",
        };
      });
      return { query, database: "PubMed", totalResults, results };
    } catch (e: any) {
      throw new Error(`PubMed search failed: ${e.message}`);
    }
  }
}

export async function openalexSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  try {
    return await postJson<SearchResponse>("/api/search/openalex", { query, apiKey }, 5000);
  } catch {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenAlex error: ${res.statusText}`);
      const data = await res.json();
      const works = data.results || [];
      const results: SearchResult[] = works.map((w: any) => {
        let abstract = "";
        if (w.abstract_inverted_index) {
          const words: [number, string][] = [];
          for (const [word, positions] of Object.entries(w.abstract_inverted_index as Record<string, number[]>)) {
            for (const pos of positions) words.push([pos, word]);
          }
          words.sort((a, b) => a[0] - b[0]);
          abstract = words.map((x) => x[1]).join(" ");
        }
        return {
          id: w.id || `openalex-${w.doi}`, title: w.title || "Untitled",
          authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean).join(", ") || "Unknown",
          year: w.publication_year || new Date().getFullYear(),
          source: w.primary_location?.source?.display_name || "OpenAlex",
          abstract, doi: w.doi ? w.doi.replace("https://doi.org/", "") : undefined,
          url: w.doi || w.id, database: "OpenAlex",
        };
      });
      return { query, database: "OpenAlex", totalResults: data.meta?.count || results.length, results };
    } catch (e: any) {
      throw new Error(`OpenAlex search failed: ${e.message}`);
    }
  }
}

export async function crossrefSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  try {
    return await postJson<SearchResponse>("/api/search/crossref", { query, apiKey }, 5000);
  } catch {
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Crossref error: ${res.statusText}`);
      const data = await res.json();
      const items = data.message?.items || [];
      const results: SearchResult[] = items.map((w: any) => ({
        id: `crossref-${w.DOI}`,
        title: Array.isArray(w.title) ? w.title[0] : (w.title || "Untitled"),
        authors: (w.author || []).map((a: any) => `${a.given || ""} ${a.family || ""}`.trim()).filter(Boolean).join(", ") || "Unknown",
        year: w.created?.["date-parts"]?.[0]?.[0] || new Date().getFullYear(),
        source: Array.isArray(w["container-title"]) ? w["container-title"][0] : (w["container-title"] || "Crossref"),
        abstract: w.abstract?.replace(/<[^>]+>/g, "") || "",
        doi: w.DOI,
        url: w.URL || (w.DOI ? `https://doi.org/${w.DOI}` : undefined),
        database: "Crossref",
      }));
      return { query, database: "Crossref", totalResults: data.message?.["total-results"] || results.length, results };
    } catch (e: any) {
      throw new Error(`Crossref search failed: ${e.message}`);
    }
  }
}

export async function clinicaltrialsSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  try {
    return await postJson<SearchResponse>("/api/search/clinicaltrials", { query, apiKey }, 5000);
  } catch {
    try {
      const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`ClinicalTrials.gov error: ${res.statusText}`);
      const data = await res.json();
      const studies = data.studies || [];
      const results: SearchResult[] = studies.map((s: any) => {
        const ps = s.protocolSection || {};
        const idModule = ps.identificationModule || {};
        const descModule = ps.descriptionModule || {};
        const sponsorModule = ps.sponsorCollaboratorsModule || {};
        const nctId = idModule.nctId || "NCT unknown";
        return {
          id: `ct-${nctId}`, title: idModule.briefTitle || "Untitled Trial",
          authors: sponsorModule.leadSponsor?.name || "ClinicalTrials.gov Sponsor",
          year: parseInt(idModule.startDateStruct?.date?.slice(0, 4), 10) || new Date().getFullYear(),
          source: "ClinicalTrials.gov", abstract: descModule.briefSummary || "",
          url: `https://clinicaltrials.gov/study/${nctId}`, database: "ClinicalTrials.gov",
        };
      });
      return { query, database: "ClinicalTrials.gov", totalResults: data.totalCount || results.length, results };
    } catch (e: any) {
      throw new Error(`ClinicalTrials.gov search failed: ${e.message}`);
    }
  }
}

export async function scopusSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  if (!apiKey) throw new Error("Scopus requires an Elsevier API key.");
  return await postJson<SearchResponse>("/api/search/scopus", { query, apiKey });
}

export async function wosSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  if (!apiKey) throw new Error("Web of Science requires a Clarivate API key.");
  return await postJson<SearchResponse>("/api/search/wos", { query, apiKey });
}

export async function embaseSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  if (!apiKey) throw new Error("Embase requires an institutional API key.");
  return await postJson<SearchResponse>("/api/search/embase", { query, apiKey });
}

export async function cochraneSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  return await postJson<SearchResponse>("/api/search/cochrane", { query, apiKey });
}

export async function prosperoSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  return await postJson<SearchResponse>("/api/search/prospero", { query, apiKey });
}

export async function googleScholarSearch(query: string, apiKey?: string): Promise<SearchResponse> {
  return await postJson<SearchResponse>("/api/search/google_scholar", { query, apiKey });
}

// ── Priority Screening ML ────────────────────────────────────────────

export async function runPriorityScreening(req: {
  items: Array<{ id: string; title: string; abstract: string; decision: string }>;
  picoTerms: string[];
}): Promise<Array<{ id: string; title: string; abstract: string; decision: string; score?: number }>> {
  return await postJson<any>("/api/living/priority", req);
}
