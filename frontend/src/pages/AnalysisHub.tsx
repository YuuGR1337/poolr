import { useState } from "react";
import type { Project } from "../lib/project";
import { APP_VERSION } from "../lib/version";
import { StudySelector, useStudyManager } from "../components/StudyManager";
import { BayesianHub } from "./hub/BayesianHub";
import { DiagnosticsHub } from "./hub/DiagnosticsHub";
import { NetworkHub } from "./hub/NetworkHub";
import { ComplexDataHub } from "./hub/ComplexDataHub";
import { DoseResponseHub } from "./hub/DoseResponseHub";
import { DiagnosticHub } from "./hub/DiagnosticHub";
import { FiguresHub } from "./hub/FiguresHub";
import { SpecializedHub } from "./hub/SpecializedHub";
import { QualityHub } from "./hub/QualityHub";
import { InteroperabilityHub } from "./hub/InteroperabilityHub";
import { ReportsHub } from "./hub/ReportsHub";
import { SpatialHub, QualitativeHub, AdvancedDiagnosticsHub } from "./hub/AdvancedEnginesHub";
import {
  Activity,
  Grid3X3,
  GitMerge,
  FileSpreadsheet,
  TrendingUp,
  Stethoscope,
  BarChart2,
  Layers,
  ShieldCheck,
  ArrowLeftRight,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight,
  FileCode,
  Globe,
  MessageSquare,
  BrainCircuit,
} from "lucide-react";

interface Props {
  project: Project;
  onProjectChange?: (p: Project) => void;
}

export type CategoryKey =
  | "overview"
  | "bayesian"
  | "diagnostics"
  | "network"
  | "complex"
  | "doseresponse"
  | "diagnostic"
  | "figures"
  | "specialized"
  | "quality"
  | "interop"
  | "reports"
  | "spatial"
  | "qualitative"
  | "advanced";

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  badge: string;
  Icon: any;
  description: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "overview",
    label: "Method finder",
    badge: "Browse methods",
    Icon: Sparkles,
    description: "Find an analysis by question, data type or method",
  },
  {
    key: "bayesian",
    label: "Bayesian & MCMC",
    badge: "Gibbs · RoBMA",
    Icon: Activity,
    description: "Gibbs sampling, Bayesian network meta-analysis, RoBMA model averaging & phylogeny",
  },
  {
    key: "diagnostics",
    label: "Diagnostics & Robustness",
    badge: "GOSH · MI · CRVE",
    Icon: Grid3X3,
    description: "GOSH combinations, Cook's D, permutation, bootstrap, TES, MI, predictions & CR-Egger",
  },
  {
    key: "network",
    label: "Network & Comparative",
    badge: "NMA · SUCRA · CNMA",
    Icon: GitMerge,
    description: "Frequentist NMA, Bayesian NMA, SUCRA rankings, Component NMA, Bucher & multi-arm",
  },
  {
    key: "complex",
    label: "Complex Data & IPD",
    badge: "Guyot · TSA · RVE",
    Icon: FileSpreadsheet,
    description: "Guyot KM IPD reconstruction, Trial Sequential Analysis, DCA curves & 3-level REML",
  },
  {
    key: "doseresponse",
    label: "Dose-Response & Splines",
    badge: "GLS · RCS · 2D",
    Icon: TrendingUp,
    description: "Greenland-Longnecker GLS, RCS 3/4/5 knots, multivariate dose & response surfaces",
  },
  {
    key: "diagnostic",
    label: "Diagnostic Test Accuracy",
    badge: "Bivariate · HSROC",
    Icon: Stethoscope,
    description: "Reitsma bivariate GLMM, Rutter & Gatsonis HSROC, Moses-Littenberg DOR forest & SROC",
  },
  {
    key: "figures",
    label: "Figures & Visualizations",
    badge: "Galbraith · L'Abbé",
    Icon: BarChart2,
    description: "Galbraith radial plot, L'Abbé plot, Baujat plot, contour-enhanced funnel & forest plots",
  },
  {
    key: "specialized",
    label: "Specialized & Niche",
    badge: "Umbrella · Qual · SCED",
    Icon: Layers,
    description: "Umbrella reviews Class I–IV, qualitative meta-synthesis, bibliometrics & niche models",
  },
  {
    key: "quality",
    label: "Evidence Quality & GRADE",
    badge: "RoB 2 · ROBINS-I",
    Icon: ShieldCheck,
    description: "RoB 2, ROBINS-I, QUADAS-2, AMSTAR 2, NOS, and GRADE Evidence Profiles",
  },
  {
    key: "interop",
    label: "Interoperability & AI Review",
    badge: "AI Screen · RevMan",
    Icon: ArrowLeftRight,
    description: "AI screening panel, RevMan 5 XML roundtrip, 3-tier dedup, Zotero sync & PRISMA flows",
  },
  {
    key: "reports",
    label: "Reports & Reproducibility",
    badge: "R · LaTeX · Methods",
    Icon: FileCode,
    description: "R replication scripts, LaTeX manuscripts, HTML executive reports & PRISMA methods",
  },
  {
    key: "spatial",
    label: "Spatial & Pharmacokinetic",
    badge: "Moran's I · PK/PD",
    Icon: Globe,
    description: "Spatial meta-analysis with CAR/SAR models, Moran's I, pharmacokinetic pooling",
  },
  {
    key: "qualitative",
    label: "Qualitative & Mixed Methods",
    badge: "Thematic · Ethnography",
    Icon: MessageSquare,
    description: "Thematic synthesis, meta-ethnography, framework synthesis, qualitative coding",
  },
  {
    key: "advanced",
    label: "Advanced Bayesian",
    badge: "Multilevel · DTA · Prog",
    Icon: BrainCircuit,
    description: "Bayesian multilevel, DTA, prognostic models, profile likelihood, fractional polynomials",
  },
];

export default function AnalysisHub({ project, onProjectChange }: Props) {
  const { studies, activeStudyId, addStudy, removeStudy, switchStudy } = useStudyManager();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("bayesian");
  const [catalogFilter, setCatalogFilter] = useState("");

  const handleAddStudy = () => {
    const name = prompt("Study name:");
    if (name) {
      addStudy(name, project);
    }
  };

  const handleImportProject = async () => {
    alert("Use the Open button in the header bar or RevMan XML Hub to import datasets.");
  };

  return (
    <div className="space-y-4">
      {/* Top bar: Multi-Study dataset selector and active study context */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-3">
          <StudySelector
            studies={studies}
            activeStudyId={activeStudyId}
            onSwitch={switchStudy}
            onAdd={handleAddStudy}
            onRemove={removeStudy}
            onImport={handleImportProject}
          />
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Active Study Dataset · {project.extraction?.studies?.length ?? 0} extracted studies ready
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <CheckCircle2 size={13} className="text-green-500" />
          <span className="font-mono font-medium text-[var(--color-text)]">
            Choose a method that fits your research question and data
          </span>
        </div>
      </div>

      {/* Segmented Category Navigation Bar — Aligned 3 Rows × 4 Columns (12 Dedicated Hubs) */}
      <nav aria-label="Analysis Hub Categories" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const Icon = cat.Icon;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`min-w-0 flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all ${
                isActive
                  ? "border-blue-600 dark:border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-[var(--color-text)] shadow-xs ring-1 ring-blue-600/30 dark:ring-blue-500/30"
                  : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--hover-surface)] hover:text-[var(--color-text)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full mb-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    size={16}
                    className={`shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-[var(--color-text-muted)]"}`}
                  />
                  <span className="text-[12.5px] font-semibold text-[var(--color-text)] whitespace-normal break-words">{cat.label}</span>
                </div>
                <span
                  className={`shrink-0  whitespace-normal break-words text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                    isActive
                      ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-600/30 dark:border-blue-500/30"
                      : "bg-[var(--color-border)]/50 text-[var(--color-text-muted)] border-[var(--color-border)]"
                  }`}
                >
                  {cat.badge}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed  break-words">
                {cat.description}
              </p>
            </button>
          );
        })}
      </nav>

      {/* Main active hub view */}
      <div className="mt-3">
        {activeCategory === "overview" && (
          <EngineCatalogView
            filter={catalogFilter}
            onFilterChange={setCatalogFilter}
            onSelectCategory={(cat) => setActiveCategory(cat)}
          />
        )}
        {activeCategory === "bayesian" && (
          <BayesianHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "diagnostics" && (
          <DiagnosticsHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "network" && (
          <NetworkHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "complex" && (
          <ComplexDataHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "doseresponse" && (
          <DoseResponseHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "diagnostic" && (
          <DiagnosticHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "figures" && (
          <FiguresHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "specialized" && (
          <SpecializedHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "quality" && (
          <QualityHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "interop" && (
          <InteroperabilityHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "reports" && (
          <ReportsHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "spatial" && (
          <SpatialHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "qualitative" && (
          <QualitativeHub project={project} onProjectChange={onProjectChange} />
        )}
        {activeCategory === "advanced" && (
          <AdvancedDiagnosticsHub project={project} onProjectChange={onProjectChange} />
        )}
      </div>
    </div>
  );
}

// ─── Cable-Managed Method finder & Status Matrix ───────────────────────────
interface CatalogItem {
  id: string;
  name: string;
  category: CategoryKey;
  endpoint: string;
  description: string;
  inputs: string;
  tag: string;
}

const ENGINE_CATALOG: CatalogItem[] = [
  // Bayesian
  { id: "bayesian", name: "Bayesian MCMC Meta-Analysis", category: "bayesian", endpoint: "/api/bayesian", description: "Gibbs sampler for hierarchical random-effects model with ROPE and Bayes Factor", inputs: "Effects & Variances", tag: "Gibbs MCMC" },
  { id: "bayesian-nma", name: "Bayesian NMA & SUCRA", category: "bayesian", endpoint: "/api/bayesian-nma", description: "Hierarchical consistency model, SUCRA rankings and rank probabilities", inputs: "Treatment network pairs", tag: "SUCRA / DIC" },
  { id: "bmma", name: "Bayesian Model Averaging (RoBMA)", category: "bayesian", endpoint: "/api/bma", description: "Averages across fixed, random, PET-PEESE, and selection models", inputs: "Effects & SEs", tag: "Model Averaged" },
  { id: "phylo", name: "Phylogenetic Meta-Analysis", category: "bayesian", endpoint: "/api/phylo", description: "Models evolutionary non-independence using Pagel's λ and phylogenetic trees", inputs: "Species & Covariance", tag: "Pagel's λ" },

  // Diagnostics & Robustness
  { id: "gosh", name: "GOSH Heterogeneity Analysis", category: "diagnostics", endpoint: "/api/gosh", description: "Evaluates all 2ᵏ study subsets to identify multi-cluster heterogeneity patterns", inputs: "Effects & Variances", tag: "Combinatorics" },
  { id: "influence", name: "Cook's D & Influence Diagnostics", category: "diagnostics", endpoint: "/api/influence", description: "Cook's distance, DFFITS, hat values, and studentized residuals", inputs: "Effects & Variances", tag: "Diagnostics" },
  { id: "permutation", name: "Permutation Test", category: "diagnostics", endpoint: "/api/permutation", description: "Exact / Monte Carlo label permutation test for small study sets", inputs: "Effects & Variances", tag: "Non-Parametric" },
  { id: "bootstrap", name: "Bootstrap Confidence Intervals", category: "diagnostics", endpoint: "/api/bootstrap", description: "Percentile and BCa non-parametric bootstrap confidence intervals", inputs: "Effects & Variances", tag: "Resampling" },
  { id: "tes", name: "Test of Excess Significance", category: "diagnostics", endpoint: "/api/tes", description: "Ioannidis & Trikalinos binomial test for selective reporting bias", inputs: "Effects & Variances", tag: "Publication Bias" },
  { id: "locationscale", name: "Location-Scale Meta-Regression", category: "diagnostics", endpoint: "/api/locationscale", description: "Simultaneously models effect magnitude (location) and residual variance (scale)", inputs: "Effects & Moderators", tag: "Heteroskedastic" },
  { id: "mi", name: "Multiple Imputation (Rubin's Rules)", category: "diagnostics", endpoint: "/api/mi", description: "Predictive Mean Matching (PMM) and Rubin's variance combination for missing outcome data", inputs: "Effects & Variances w/ Missing", tag: "Rubin PMM" },
  { id: "prediction", name: "Prediction Intervals (Graham-Higgins)", category: "diagnostics", endpoint: "/api/prediction", description: "95% prediction intervals for individual clinical settings with t-distribution critical values", inputs: "Pooled, SE, Tau², k", tag: "Prediction Interval" },
  { id: "modelaverage", name: "Frequentist Model Averaging", category: "diagnostics", endpoint: "/api/modelaverage", description: "AICc-weighted multimodel averaging across DL, REML, ML, PM, and Fixed-Effect estimators", inputs: "Effects & Variances", tag: "Akaike Weights" },
  { id: "proportion", name: "Single-Arm Proportion Meta-Analysis", category: "diagnostics", endpoint: "/api/proportion", description: "Pooled proportions via GLMM logit-normal and Freeman-Tukey double-arcsine transform", inputs: "Events (r) & Total (N)", tag: "GLMM Laplace" },
  { id: "pvalue-combine", name: "P-Value Combination Suite", category: "diagnostics", endpoint: "/api/powerhouse/pvalue-combine", description: "Combines significance using Fisher, Stouffer Z, Tippett minimum, and Edgington sum tests", inputs: "List of p-values", tag: "Fisher / Stouffer" },
  { id: "cluster-detect", name: "Funnel Plot Cluster Detection", category: "diagnostics", endpoint: "/api/cluster/detect", description: "DBSCAN density clustering on effect-precision space and Fail-Safe N calculations", inputs: "Effects & Variances", tag: "DBSCAN" },
  { id: "clusterrobust", name: "Cluster-Robust Egger Test", category: "diagnostics", endpoint: "/api/clusterrobust/egger", description: "Small-sample CRVE sandwich covariance estimator for publication bias with dependent studies", inputs: "Effects, SEs & Clusters", tag: "CRVE Egger" },

  // Network & Comparative
  { id: "nma", name: "Frequentist Network Meta-Analysis", category: "network", endpoint: "/api/nma", description: "Rücker graph-theoretic NMA with network inconsistency decomposition", inputs: "Pairwise contrast pairs", tag: "Graph Theory" },
  { id: "sucra-ci", name: "SUCRA Rankings & Bootstrap CIs", category: "network", endpoint: "/api/sucra", description: "Surface Under Cumulative Ranking Curve with percentile bootstrap confidence bounds", inputs: "P-score / SUCRA matrix", tag: "SUCRA 95% CI" },
  { id: "cnma", name: "Component Network Meta-Analysis", category: "network", endpoint: "/api/cnma", description: "Estimates independent effects of components in multi-ingredient interventions", inputs: "Multi-component arms", tag: "Additivity" },
  { id: "bucher", name: "Bucher Indirect Comparison", category: "network", endpoint: "/api/bucher", description: "Indirect contrast via common comparator C (A vs B = A vs C - B vs C)", inputs: "Arms vs Common", tag: "Indirect Contrast" },
  { id: "multiarm", name: "Multi-Arm Trial Adjustment", category: "network", endpoint: "/api/nma/multiarm", description: "Corrects covariance induced by shared control arms in 3-arm / 4-arm trials", inputs: "Multi-arm trials", tag: "Covariance" },
  { id: "nma-multilevel", name: "3-Level Multilevel NMA", category: "network", endpoint: "/api/nma/multilevel", description: "Hierarchical network meta-analysis decomposing within-study and between-study trial variance", inputs: "Contrast network & Clusters", tag: "Hierarchical NMA" },
  { id: "nma-regression", name: "Network Meta-Regression", category: "network", endpoint: "/api/nma/regression", description: "Evaluates treatment-by-covariate interactions across complex multi-treatment networks", inputs: "Network & Study Covariates", tag: "NMA Covariate" },
  { id: "league-matrix", name: "League Table Matrix Generator", category: "network", endpoint: "/api/figure/league-matrix", description: "Publication-ready vector SVG league matrix with all pairwise comparisons", inputs: "NMA Matrix", tag: "SVG Vector" },
  { id: "bubble-plot", name: "Continuous Bubble Plot", category: "network", endpoint: "/api/figure/bubble", description: "SVG continuous meta-regression plot with weights mapped to bubble radii", inputs: "Moderator & Effect", tag: "SVG Vector" },

  // Complex Data & IPD
  { id: "ipd-from-km", name: "Guyot IPD from KM Curves", category: "complex", endpoint: "/api/ipd/from-km", description: "Reconstructs individual patient survival times from digitized KM curves with CSV export", inputs: "Time & Survival coords", tag: "Guyot (2012)" },
  { id: "tsa", name: "Trial Sequential Analysis (TSA)", category: "complex", endpoint: "/api/advanced/sequential", description: "O'Brien-Fleming monitoring boundaries, required information size (RIS), and futility zones", inputs: "Information size & Events", tag: "O'Brien-Fleming" },
  { id: "dca", name: "Decision Curve Analysis (DCA)", category: "complex", endpoint: "/api/advanced/dca", description: "Net Benefit curves comparing model strategy against treat-all and treat-none thresholds", inputs: "Thresholds & Probabilities", tag: "Vickers DCA" },
  { id: "competing-risks", name: "Competing Risks (Fine-Gray)", category: "complex", endpoint: "/api/competing-risks", description: "Subdistribution hazard ratios (sHR) and cumulative incidence functions (CIF)", inputs: "Subdistribution Hazards", tag: "Fine-Gray" },
  { id: "cumulative-forest", name: "Cumulative Forest Evolution", category: "complex", endpoint: "/api/figure/cumulative-forest", description: "Chronological cumulative meta-analysis tracking effect stabilization and I² evolution", inputs: "Studies ordered by Year", tag: "Chronological" },
  { id: "prognostic-meta", name: "Prognostic Factor Meta-Analysis", category: "complex", endpoint: "/api/prognostic/meta", description: "Prognostic factor pooling with CHARMS checklist and TRIPOD compliance audit", inputs: "Adjusted HRs / ORs", tag: "CHARMS / TRIPOD" },
  { id: "rve", name: "Robust Variance Estimation (RVE)", category: "complex", endpoint: "/api/rve", description: "Hedges, Tipton & Pustejovsky CR2 correction for dependent effect sizes", inputs: "Effects & Study IDs", tag: "CR2 Correction" },
  { id: "multilevel", name: "3-Level Multilevel Meta-Analysis", category: "complex", endpoint: "/api/multilevel", description: "Decomposes variance into sampling (L1), within-study (L2), and between-study (L3)", inputs: "Effects & Clusters", tag: "REML 3-Level" },
  { id: "survival", name: "Survival RMST Synthesis", category: "complex", endpoint: "/api/survival", description: "Restricted mean survival time (RMST) differences and life-expectancy gains", inputs: "Truncation time & RMST", tag: "RMST" },

  // Dose-Response & Splines
  { id: "dose-gls", name: "Greenland-Longnecker GLS Trend", category: "doseresponse", endpoint: "/api/dose", description: "Generalized Least Squares trend for correlated relative risks in categorized dose groups", inputs: "Doses, Cases & Relative Risks", tag: "GLS Trend" },
  { id: "dose-rcs", name: "Restricted Cubic Splines (RCS)", category: "doseresponse", endpoint: "/api/rcs", description: "Non-linear RCS dose-response curves with Harrell knot placement and Wald test of non-linearity", inputs: "Dose & Effect pairs", tag: "RCS 3/4/5 Knots" },
  { id: "dose-multi", name: "Multivariate Dose-Response", category: "doseresponse", endpoint: "/api/dose/multivariate", description: "Multivariate GLS pooling across multi-exposure dimensional studies", inputs: "Exposure doses & Covariance", tag: "Multivariate" },
  { id: "response-surface", name: "2D Response Surface", category: "doseresponse", endpoint: "/api/response-surface", description: "Bivariate dose-interaction response surface modeling dual exposures", inputs: "Dose 1, Dose 2 & Effects", tag: "Response Surface" },
  { id: "spatiotemporal", name: "Spatio-Temporal Meta-Analysis", category: "doseresponse", endpoint: "/api/spatiotemporal", description: "Spatial Matérn covariance kernel and temporal AR(1) autocorrelation modeling", inputs: "Coordinates, Year & Effects", tag: "Matérn / AR(1)" },

  // Diagnostic Test Accuracy
  { id: "dta-bivariate", name: "Bivariate DTA Meta-Analysis (Reitsma)", category: "diagnostic", endpoint: "/api/dta/bivariate", description: "Joint bivariate GLMM for logit sensitivity and logit specificity with correlation ρ", inputs: "TP, FP, FN, TN 2x2 counts", tag: "Reitsma GLMM" },
  { id: "dta-hsroc", name: "HSROC Model (Rutter & Gatsonis)", category: "diagnostic", endpoint: "/api/dta/hsroc", description: "Hierarchical SROC estimating diagnostic accuracy, threshold parameter, and scale shape", inputs: "2x2 Contingency Tables", tag: "HSROC" },
  { id: "dta-dor-forest", name: "Diagnostic OR Forest & SROC Curve", category: "diagnostic", endpoint: "/api/dta/dor-forest", description: "Moses-Littenberg SROC curve with AUC integration and Diagnostic Odds Ratio forest plot", inputs: "2x2 Diagnostic Data", tag: "Moses-Littenberg" },
  { id: "prisma-dta-flow", name: "PRISMA-DTA 2018 Flow Diagram", category: "diagnostic", endpoint: "/api/prisma-dta", description: "Vector SVG flow tailored for diagnostic test accuracy systematic reviews", inputs: "DTA Identification Counts", tag: "PRISMA-DTA" },

  // Figures & Visualizations
  { id: "fig-galbraith", name: "Galbraith Radial Plot", category: "figures", endpoint: "/api/figure/galbraith", description: "Standardized effect vs precision with 95% confidence arc for heterogeneity screening", inputs: "Effects & Variances", tag: "Radial Plot" },
  { id: "fig-labbe", name: "L'Abbé Binary Plot", category: "figures", endpoint: "/api/figure/labbe", description: "Experimental event rate vs control event rate with equality line and effect bubbles", inputs: "Binary 2x2 Arm Data", tag: "L'Abbé" },
  { id: "fig-baujat", name: "Baujat Influence Plot", category: "figures", endpoint: "/api/figure/baujat", description: "Contribution to overall heterogeneity Q vs influence on overall pooled effect", inputs: "Effects & Variances", tag: "Baujat" },
  { id: "fig-contour", name: "Contour-Enhanced Funnel Plot", category: "figures", endpoint: "/api/figure/funnel_contour", description: "Funnel plot overlaid with p < 0.10, p < 0.05, p < 0.01 statistical significance contours", inputs: "Meta-analysis model", tag: "Significance Contours" },
  { id: "fig-forest", name: "Vector SVG Forest Plot", category: "figures", endpoint: "/api/figure/forest", description: "Publication-grade vector SVG forest plot with diamond summary and weights", inputs: "Meta-analysis model", tag: "SVG Forest" },
  { id: "fig-funnel", name: "Vector SVG Funnel Plot", category: "figures", endpoint: "/api/figure/funnel", description: "Vector SVG funnel plot with pseudo 95% confidence intervals", inputs: "Meta-analysis model", tag: "SVG Funnel" },

  // Specialized & Niche
  { id: "umbrella", name: "Umbrella Review Evidence Grading", category: "specialized", endpoint: "/api/umbrella", description: "Ioannidis Class I-IV criteria grading: significance, sample size, heterogeneity & Egger bias", inputs: "Systematic Review Meta-Analyses", tag: "Ioannidis Class I-IV" },
  { id: "qualitative", name: "Qualitative Meta-Synthesis", category: "specialized", endpoint: "/api/qualitative/meta", description: "Thomas & Harden thematic synthesis with inductive descriptive coding and frequency matrix", inputs: "Qualitative Quotes & Themes", tag: "Thematic Matrix" },
  { id: "bibliometrics", name: "Citation Network & Bibliometrics", category: "specialized", endpoint: "/api/citation/network", description: "Adjacency matrix, co-citation clustering, betweenness centrality, and H-index tracking", inputs: "Citation DOIs & References", tag: "Graph Centrality" },
  { id: "niche-corr", name: "Correlation Coefficient Meta-Analysis", category: "specialized", endpoint: "/api/niche/correlation", description: "Fisher's z-transformation for Pearson r and Spearman rho correlations", inputs: "Correlation (r) & N", tag: "Fisher's Z" },
  { id: "niche-var", name: "Variability Ratio (VR / CVR)", category: "specialized", endpoint: "/api/niche/variability", description: "Nakagawa variability ratio and coefficient of variation ratio between groups", inputs: "Means, SDs & Sample sizes", tag: "Variability Ratio" },
  { id: "niche-sced", name: "Single-Case Experimental Design (SCED)", category: "specialized", endpoint: "/api/niche/sced", description: "Non-overlap of all pairs (NAP), Tau-U trend control, and Percentage of Non-Overlapping Data", inputs: "Baseline & Intervention Points", tag: "Tau-U / NAP" },
  { id: "niche-poisson", name: "Poisson GLMM Rate-Ratio", category: "specialized", endpoint: "/api/niche/poisson", description: "Incidence rate ratio synthesis with log-person-time offsets and Poisson overdispersion", inputs: "Events & Person-Time Offsets", tag: "Poisson GLMM" },
  { id: "niche-agreement", name: "Inter-Rater Reliability & Agreement", category: "specialized", endpoint: "/api/niche/agreement", description: "Synthesis of Cohen's Kappa, Fleiss' Kappa, and Intraclass Correlation Coefficients (ICC)", inputs: "Kappa / ICC & Variances", tag: "Kappa / ICC" },

  // Evidence Quality & GRADE
  { id: "rob2", name: "Cochrane Risk of Bias 2 (RoB 2)", category: "quality", endpoint: "/api/rob2", description: "5 domains for RCTs with traffic light SVG and weighted summary bars", inputs: "Domain judgments", tag: "Cochrane Standard" },
  { id: "robins-i", name: "ROBINS-I Tool", category: "quality", endpoint: "/api/robins-i", description: "7 domains for non-randomized studies of interventions", inputs: "NRSI domains", tag: "Non-Randomized" },
  { id: "quadas-2", name: "QUADAS-2 Tool", category: "quality", endpoint: "/api/quadas-2", description: "Quality assessment tool for diagnostic accuracy studies across 4 domains", inputs: "DTA domains", tag: "Diagnostic" },
  { id: "amstar-2", name: "AMSTAR 2 Appraisal", category: "quality", endpoint: "/api/amstar-2", description: "16-item critical appraisal instrument with critical flaw weighting", inputs: "Appraisal items", tag: "Systematic Review" },
  { id: "nos", name: "Newcastle-Ottawa Scale (NOS)", category: "quality", endpoint: "/api/nos", description: "Star rating system for cohort and case-control observational studies", inputs: "Selection & Outcome", tag: "Observational" },
  { id: "grade-profile", name: "GRADE Evidence Profile & SoF", category: "quality", endpoint: "/api/grade/evidence-profile", description: "Certainty ratings across 5 downgrade factors (RoB, Inconsistency, Imprecision, etc.)", inputs: "Study assessments", tag: "GRADE Standard" },

  // Interoperability & AI Review
  { id: "ai-screening", name: "Interactive AI Screening Panel", category: "interop", endpoint: "/api/ai/screening", description: "Title/Abstract screening with PICO criteria, semantic confidence scoring, and reviewer override", inputs: "PICO Criteria & Citations", tag: "AI Screening" },
  { id: "revman", name: "RevMan 5 XML Import / Export", category: "interop", endpoint: "/api/revman/import", description: "Full roundtrip compatibility with Cochrane Review Manager (.rm5)", inputs: "XML / CSV", tag: "Cochrane XML" },
  { id: "deduplicate", name: "Citation Deduplication Pipeline", category: "interop", endpoint: "/api/deduplicate", description: "3-tier deduplication via DOI, Levenshtein title distance, and Author/Year", inputs: "Citation list", tag: "Multi-Pass" },
  { id: "zotero", name: "Zotero & Mendeley Sync", category: "interop", endpoint: "/api/zotero/connect", description: "Two-way cloud reference sync for libraries, collections, and attachments", inputs: "API Credentials", tag: "Reference Sync" },
  { id: "prisma-dta", name: "PRISMA-DTA Flow Diagram", category: "interop", endpoint: "/api/prisma-dta", description: "Vector SVG flowchart tailored for diagnostic test accuracy systematic reviews", inputs: "Screening counts", tag: "PRISMA-DTA" },
  { id: "scr-flow", name: "PRISMA-ScR Scoping Diagram", category: "interop", endpoint: "/api/scr/flow", description: "Vector SVG flowchart tailored for scoping reviews according to PRISMA-ScR", inputs: "ScR flow counts", tag: "PRISMA-ScR" },
  { id: "living-automate", name: "Living Review Surveillance", category: "interop", endpoint: "/api/living/automate", description: "Autonomous periodic surveillance search and screening threshold triggers", inputs: "Search query & timer", tag: "Autonomous" },

  // Reports & Reproducibility
  { id: "r-code", name: "R Replication Code Studio", category: "reports", endpoint: "/api/export/r_code", description: "Automated reproducible R script using metafor, netmeta, and dmetar", inputs: "Model results & data", tag: "metafor / R" },
  { id: "methods-para", name: "Methods Paragraph Generator", category: "reports", endpoint: "/api/export/methods", description: "Standardized Cochrane and PRISMA statistical methods text drafting", inputs: "Model parameters", tag: "Methods Paragraph" },
  { id: "latex-manuscript", name: "LaTeX Manuscript & Tables", category: "reports", endpoint: "/api/report/latex", description: "Full publication-grade LaTeX source with formatted tables and TikZ plots", inputs: "Synthesis results", tag: "LaTeX / TikZ" },
  { id: "html-report", name: "Standalone HTML Executive Report", category: "reports", endpoint: "/api/report/html", description: "Single-file interactive HTML report with embedded styles and charts", inputs: "Synthesis results", tag: "Executive HTML" },
  { id: "stata-python", name: "Python & Stata Scripts", category: "reports", endpoint: "/api/report/python", description: "Script translation into Python (statsmodels) and Stata meta commands", inputs: "Study datasets", tag: "Python / Stata" },
  { id: "citations-export", name: "Bibliographic Citations Exporter", category: "reports", endpoint: "/api/export/citations", description: "Export included studies into BibTeX (.bib) and RIS reference formats", inputs: "Citations / DOIs", tag: "BibTeX / RIS" },
];

function EngineCatalogView({
  filter,
  onFilterChange,
  onSelectCategory,
}: {
  filter: string;
  onFilterChange: (s: string) => void;
  onSelectCategory: (cat: CategoryKey) => void;
}) {
  const filtered = ENGINE_CATALOG.filter(
    (e) =>
      e.name.toLowerCase().includes(filter.toLowerCase()) ||
      e.description.toLowerCase().includes(filter.toLowerCase()) ||
      e.endpoint.toLowerCase().includes(filter.toLowerCase()) ||
      e.tag.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 bg-[var(--color-card)] p-4 rounded-lg border border-[var(--color-border)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Analysis methods
          </h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Choose a method after checking its data requirements and assumptions.
          </p>
        </div>
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Search methods or research questions…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--input-bg)] text-[var(--color-text)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectCategory(item.category)}
            className="group flex flex-col justify-between p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:border-blue-500/50 hover:bg-[var(--hover-surface)] transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold whitespace-normal break-words shrink-0">
                  {item.tag}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-muted-foreground)] whitespace-normal break-words">
                  {item.endpoint}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-[var(--color-text)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-normal break-words">
                {item.name}
              </h3>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1  break-words">
                {item.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[10.5px]">
              <span className="text-[var(--color-muted-foreground)] whitespace-normal break-words mr-2">Inputs: {item.inputs}</span>
              <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
                Open <ChevronRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
