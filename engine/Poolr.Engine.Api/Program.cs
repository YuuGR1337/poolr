using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Poolr.Engine.Api;

if (args.Contains("--collaboration-command")) { Environment.ExitCode = await CollaborationCommand.Run(); return; }



var builder = WebApplication.CreateBuilder(args);

// Listen on localhost only -- the Tauri shell bridges the webview to this sidecar.
builder.WebHost.UseUrls("http://127.0.0.1:5180");

var app = builder.Build();

// CORS -- the Tauri webview and a plain browser dev server both call this sidecar
// from a different origin (tauri://localhost or localhost:1420). Allow it.
app.Use(async (ctx, next) =>
{
    var origin = ctx.Request.Headers.Origin.ToString();
    var allowed = new[] { "http://localhost:1420", "http://127.0.0.1:1420", "tauri://localhost", "http://tauri.localhost", "https://tauri.localhost" };
    if (origin.Length > 0 && !allowed.Contains(origin)) { ctx.Response.StatusCode = 403; return; }
    if (origin.Length > 0) ctx.Response.Headers.Append("Access-Control-Allow-Origin", origin);
    ctx.Response.Headers.Append("Vary", "Origin");
    if (ctx.Request.Method == "POST" && ctx.Request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) != true) { ctx.Response.StatusCode = 415; return; }
    ctx.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    ctx.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type");
    if (ctx.Request.Method == "OPTIONS")
    {
        ctx.Response.StatusCode = 204;
        return;
    }
    await next();
});

app.MapGet("/health", () => Results.Ok(new { ok = true, version = "0.6.4", engine = "csharp" }));
app.MapGet("/version", () => Results.Ok(new { version = "0.6.4" }));

app.MapPost("/api/meta", ([FromBody] MetaRequest req) =>
{
    try
    {
        var ma = new MetaAnalysis(req.model, req.measure, req.method, req.subgroup, req.pub_bias);
        var result = ma.Run(req.data ?? new());
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.1 -- extended meta-analysis (KH, MH/Peto, subgroups w/ Q-between, sensitivity, bias depth, new outcome types)
app.MapPost("/api/meta2", async (HttpRequest httpReq) =>
{
    try
    {
        using var sr = new StreamReader(httpReq.Body);
        var raw = await sr.ReadToEndAsync();
        var req = System.Text.Json.JsonSerializer.Deserialize<ExtendedMetaRequest>(raw,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new ExtendedMetaRequest();
        var ma = new ExtendedMetaAnalysis(req.model, req.measure, req.method, req.subgroup,
            req.knapp_hartung, string.IsNullOrWhiteSpace(req.bias_depth) ? req.pub_bias : req.bias_depth);
        var result = ma.Run(req.data ?? new(), req.exclude, req.sensitivity);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.1 -- effect-size conversions / median completion
app.MapPost("/api/convert", ([FromBody] ConvertRequest req) =>
{
    try { return Results.Ok(Converters.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.1 -- diagnostic figures (Galbraith, L'Abbe, Baujat, contour funnel)
app.MapPost("/api/figure/galbraith", (DiagnosticFigures.PlotInput req) =>
    Results.Text(DiagnosticFigures.Galbraith(req, 0), "image/svg+xml"));
app.MapPost("/api/figure/labbe", (List<DiagnosticFigures.LabbeArm> arms) =>
{
    try
    {
        var list = arms.Select(t => (t.name, t.a, t.n1, t.c, t.n2)).ToList();
        return Results.Text(DiagnosticFigures.Labbe(list), "image/svg+xml");
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/figure/baujat", (DiagnosticFigures.PlotInput req) =>
    Results.Text(DiagnosticFigures.Baujat(req), "image/svg+xml"));
app.MapPost("/api/figure/funnel_contour", ([FromBody] MetaResponse req) =>
    Results.Text(DiagnosticFigures.ContourFunnel(req), "image/svg+xml"));

// v0.5.1 -- export suite (R replication, citations, methods paragraph)
app.MapPost("/api/export/r_code", async (HttpRequest httpReq) =>
{
    try
    {
        using var sr = new StreamReader(httpReq.Body);
        var raw = await sr.ReadToEndAsync();
        var doc = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(raw);
        var resp = doc.GetProperty("response").Deserialize<ExtendedMetaResponse>();
        var data = doc.GetProperty("data").Deserialize<List<Study>>();
        return Results.Text(ExportSuite.RReplication(resp!, data ?? new()), "text/plain");
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/export/citations", async (HttpRequest httpReq) =>
{
    try
    {
        using var sr = new StreamReader(httpReq.Body);
        var raw = await sr.ReadToEndAsync();
        var doc = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(raw);
        var data = doc.GetProperty("data").Deserialize<List<Study>>() ?? new();
        string fmt = httpReq.Query["format"].ToString().ToLowerInvariant();
        string text = fmt == "bibtex"
            ? ExportSuite.BibTeX(data)
            : ExportSuite.RisExport(data);
        return Results.Text(text, "text/plain");
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/export/methods", ([FromBody] ExtendedMetaResponse req) =>
    Results.Text(ExportSuite.MethodsParagraph(req), "text/plain"));

// v0.5.1 -- robvis-style RoB figures
app.MapPost("/api/figure/rob_traffic", ([FromBody] RobFigures.TrafficLightRequest req) =>
    Results.Text(RobFigures.TrafficLight(req), "image/svg+xml"));
app.MapPost("/api/figure/rob_summary", ([FromBody] RobFigures.TrafficLightRequest req) =>
    Results.Text(RobFigures.SummaryBar(req), "image/svg+xml"));

// Phase B5 -- figures (SVG). Returns image/svg+xml.
app.MapPost("/api/figure/forest", ([FromBody] MetaResponse req) =>
    Results.Text(Figures.ForestPlot(req), "image/svg+xml"));
app.MapPost("/api/figure/funnel", ([FromBody] MetaResponse req) =>
    Results.Text(Figures.FunnelPlot(req), "image/svg+xml"));

// Phase B6 -- export. ?format=json|md|latex|docx
// NOTE: bind the raw request body rather than [FromBody] Dictionary<string,object>.
// System.Text.Json materialises NESTED objects/arrays as JsonElement, so the
// exporters' `is Dictionary<string,object>` / `is List<object>` checks failed and
// pico / meta.results / extraction.studies were silently dropped. Normalize first.
app.MapPost("/api/export", async (HttpRequest req, string format = "json") =>
{
    try
    {
        using var sr = new StreamReader(req.Body);
        var raw = await sr.ReadToEndAsync();
        object? parsed = string.IsNullOrWhiteSpace(raw)
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<object>(raw);
        var project = Exporter.Normalize(parsed) as Dictionary<string, object>
                      ?? new Dictionary<string, object>();

        switch (format.ToLowerInvariant())
        {
            case "md": return Results.Text(Exporter.ToMarkdown(project), "text/markdown; charset=utf-8");
            case "latex": return Results.Text(Exporter.ToLatex(project), "application/x-tex");
            case "docx": return Results.File(Exporter.ToDocx(project), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "poolr_report.docx");
            default: return Results.Text(Exporter.ToJson(project), "application/json");
        }
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// File access is available only through the native stdio bridge.

// v0.5.1 -- GRADE Summary-of-Findings
app.MapPost("/api/grade/sof", ([FromBody] SofGenerator.SofRequest req) =>
{
    try
    {
        var (rows, markdown) = SofGenerator.Generate(req);
        return Results.Json(new { rows, markdown }, SofJson.Options);
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// GRADE evidence profile.
app.MapPost("/api/grade", ([FromBody] GradeRequest req) =>
{
    try
    {
        var rows = GradeEngine.Evaluate(req);
        return Results.Ok(rows);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Living Systematic Review
app.MapPost("/api/living/cumulative", ([FromBody] LivingReviewEngine.CumulativeRequest req) =>
{
    try { return Results.Ok(LivingReviewEngine.RunCumulative(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

app.MapPost("/api/living/priority", ([FromBody] LivingReviewEngine.PriorityScreeningRequest req) =>
{
    try { return Results.Ok(LivingReviewEngine.RunPriorityScreening(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Niche MA types (correlations, variability, SCED, Poisson, agreement)
app.MapPost("/api/niche/correlation", ([FromBody] List<NicheEngine.CorrelationStudy> studies) =>
{
    try { return Results.Ok(NicheEngine.RunCorrelationHunterSchmidt(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/niche/variability", ([FromBody] List<NicheEngine.VariabilityStudy> studies) =>
{
    try { return Results.Ok(NicheEngine.RunVariabilityRatio(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/niche/sced", ([FromBody] List<NicheEngine.ScdStudy> studies) =>
{
    try { return Results.Ok(NicheEngine.RunScd(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/niche/poisson", ([FromBody] List<NicheEngine.PoissonStudy> studies) =>
{
    try { return Results.Ok(NicheEngine.RunPoissonGlmm(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/niche/agreement", ([FromBody] List<NicheEngine.AgreementStudy> studies) =>
{
    try { return Results.Ok(NicheEngine.RunAgreement(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Specialized (QoL, Economic, Genetics, Ecology, Education, Adverse Events)
app.MapPost("/api/specialized/qol", ([FromBody] SpecializedEngine.QolRequest req) =>
{
    try { return Results.Ok(SpecializedEngine.RunQol(req.studies, req.pooledBaselineSd)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/specialized/economic", ([FromBody] List<SpecializedEngine.CostStudy> studies) =>
{
    try { return Results.Ok(SpecializedEngine.RunEconomic(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/specialized/genetic", ([FromBody] List<SpecializedEngine.GeneticStudy> studies) =>
{
    try { return Results.Ok(SpecializedEngine.RunGenetic(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/specialized/ecological", ([FromBody] List<SpecializedEngine.EcologicalStudy> studies) =>
{
    try { return Results.Ok(SpecializedEngine.RunEcological(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/specialized/prepost", ([FromBody] List<SpecializedEngine.PrePostStudy> studies) =>
{
    try { return Results.Ok(SpecializedEngine.RunPrePost(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/specialized/adverse", ([FromBody] List<SpecializedEngine.AeStudy> studies) =>
{
    try { return Results.Ok(SpecializedEngine.RunAdverseEvents(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Advanced (Prognostic, Qualitative, Bibliometric, Sequential, DCA)
app.MapPost("/api/advanced/prognostic", ([FromBody] List<AdvancedEngine.PrognosticStudy> studies) =>
{
    try { return Results.Ok(AdvancedEngine.RunPrognostic(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/advanced/qualitative", ([FromBody] List<AdvancedEngine.CodeEntry> entries) =>
{
    try { return Results.Ok(AdvancedEngine.RunQualitative(entries)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/advanced/bibliometric", ([FromBody] List<AdvancedEngine.CitationEntry> entries) =>
{
    try { return Results.Ok(AdvancedEngine.RunBibliometric(entries)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/advanced/sequential", ([FromBody] AdvancedEngine.SequentialRequest req) =>
{
    try { return Results.Ok(AdvancedEngine.RunSequential(req.studies, req.alpha, req.beta, req.expectedEffect)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/advanced/dca", ([FromBody] List<AdvancedEngine.DcaStudy> studies) =>
{
    try { return Results.Ok(AdvancedEngine.RunDca(studies)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Collaboration (snapshots, diff, restore)
app.MapPost("/api/collaboration/snapshot", ([FromBody] CollaborationEngine.SnapshotRequest req) =>
{
    try { return Results.Ok(new { id = CollaborationEngine.CreateSnapshot(req) }); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/collaboration/snapshots", () =>
{
    try { return Results.Ok(CollaborationEngine.ListSnapshots()); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/collaboration/diff", ([FromBody] CollaborationEngine.DiffRequest req) =>
{
    try { return Results.Ok(CollaborationEngine.GetDiff(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/collaboration/restore", ([FromBody] CollaborationEngine.RestoreRequest req) =>
{
    try { return Results.Ok(new { json = CollaborationEngine.RestoreSnapshot(req) }); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Reporting (LaTeX, HTML, Python, Stata)
app.MapPost("/api/report/latex", ([FromBody] ReportingEngine.ManuscriptRequest req) =>
    Results.Text(ReportingEngine.GenerateLatex(req), "application/x-tex"));
app.MapPost("/api/report/html", ([FromBody] ReportingEngine.HtmlReportRequest req) =>
    Results.Text(ReportingEngine.GenerateHtmlReport(req), "text/html"));
app.MapPost("/api/report/python", ([FromBody] ReportingEngine.ManuscriptRequest req) =>
    Results.Text(ReportingEngine.GeneratePythonReplication(req), "text/plain"));
app.MapPost("/api/report/stata", ([FromBody] ReportingEngine.ManuscriptRequest req) =>
    Results.Text(ReportingEngine.GenerateStataReplication(req), "text/plain"));

// v0.5.7 -- AI-assisted screening / extraction / RoB / GRADE
app.MapPost("/api/ai/screening", async (HttpRequest req) =>
{
    try
    {
        using var sr = new StreamReader(req.Body);
        var raw = await sr.ReadToEndAsync();
        return Results.Ok(new { message = "AI screening endpoint - configure LLM in settings" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Survival extensions (RMST, IPD reconstruction)
app.MapPost("/api/survival", async (HttpRequest req) =>
{
    try
    {
        using var sr = new StreamReader(req.Body);
        var raw = await sr.ReadToEndAsync();
        var doc = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(raw);
        var type = doc.GetProperty("type").GetString();

        if (type == "rmst")
        {
            var rmstReq = doc.GetProperty("request").Deserialize<SurvivalEngine.RmstRequest>();
            if (rmstReq == null) return Results.BadRequest(new { error = "Invalid RMST request body" });
            return Results.Ok(SurvivalEngine.RunRmst(rmstReq));
        }
        else if (type == "kmreconstruct")
        {
            var kmReq = doc.GetProperty("request").Deserialize<SurvivalEngine.KmReconstructionRequest>();
            if (kmReq == null) return Results.BadRequest(new { error = "Invalid KM reconstruction request body" });
            return Results.Ok(SurvivalEngine.ReconstructIPD(kmReq));
        }

        return Results.BadRequest(new { error = "Unknown survival analysis type" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Proportion Meta-Analysis (extended)
app.MapPost("/api/proportion", ([FromBody] ProportionEngine.ProportionRequest req) =>
{
    try
    {
        var result = ProportionEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Prediction interval
app.MapPost("/api/prediction", ([FromBody] PredictionEngine.PredictionRequest req) =>
{
    try { return Results.Ok(PredictionEngine.ComputePredictionInterval(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Model averaging
app.MapPost("/api/modelaverage", ([FromBody] PredictionEngine.ModelAverageRequest req) =>
{
    try { return Results.Ok(PredictionEngine.RunModelAveraging(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.5.7 -- Dose-Response Meta-Analysis
app.MapPost("/api/dose", ([FromBody] DoseResponseEngine.DoseRequest req) =>
{
    try
    {
        var result = DoseResponseEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- IPD Meta-Analysis
app.MapPost("/api/ipd", ([FromBody] IpdEngine.IpdRequest req) =>
{
    try
    {
        var result = IpdEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Diagnostic Test Accuracy Meta-Analysis
app.MapPost("/api/dta", ([FromBody] DtaEngine.DtaRequest req) =>
{
    try
    {
        var result = DtaEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Multilevel / Multivariate / RVE
app.MapPost("/api/multilevel", ([FromBody] MultilevelEngine.MultilevelRequest req) =>
{
    try
    {
        var result = MultilevelEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// v0.5.7 -- Network Meta-Analysis
app.MapPost("/api/nma", ([FromBody] NmaEngine.NmaRequest req) =>
{
    try
    {
        var result = NmaEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Bayesian MCMC Meta-Analysis
app.MapPost("/api/bayesian", ([FromBody] BayesianMcmcEngine.BayesianRequest req) =>
{
    try
    {
        var result = BayesianMcmcEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- GOSH (Graphic Approach to Heterogeneity)
app.MapPost("/api/gosh", ([FromBody] GoshEngine.GoshRequest req) =>
{
    try
    {
        var result = GoshEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Influence Diagnostics
app.MapPost("/api/influence", ([FromBody] InfluenceEngine.InfluenceRequest req) =>
{
    try
    {
        var result = InfluenceEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Permutation Test
app.MapPost("/api/permutation", ([FromBody] PermutationEngine.PermutationRequest req) =>
{
    try
    {
        var result = PermutationEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Bootstrap Confidence Intervals
app.MapPost("/api/bootstrap", ([FromBody] BootstrapEngine.BootstrapRequest req) =>
{
    try
    {
        var result = BootstrapEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Test of Excess Significance
app.MapPost("/api/tes", ([FromBody] TesEngine.TesRequest req) =>
{
    try
    {
        var result = TesEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Location-Scale Meta-Analysis
app.MapPost("/api/locationscale", ([FromBody] LocationScaleEngine.LocationScaleRequest req) =>
{
    try
    {
        var result = LocationScaleEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Multiple Imputation for Missing Data
app.MapPost("/api/mi", ([FromBody] MultipleImputationEngine.MiRequest req) =>
{
    try
    {
        var result = MultipleImputationEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Restricted Cubic Splines for Dose-Response
app.MapPost("/api/rcs", ([FromBody] RcsEngine.RcsRequest req) =>
{
    try
    {
        var result = RcsEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Cluster-Robust Inference for Dependent Effects
app.MapPost("/api/clusterrobust", ([FromBody] ClusterRobustEngine.ClusterRobustRequest req) =>
{
    try
    {
        var result = ClusterRobustEngine.Run(req);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Engine -- Prognostic Model Meta-Analysis
app.MapPost("/api/prognostic/meta", ([FromBody] PrognosticMetaEngine.PrognosticMetaRequest req) =>
{
    try { return Results.Ok(PrognosticMetaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Bivariate DTA Meta-Analysis
app.MapPost("/api/dta/bivariate", ([FromBody] BivariateDtaEngine.BivariateRequest req) =>
{
    try { return Results.Ok(BivariateDtaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Multilevel NMA
app.MapPost("/api/nma/multilevel", ([FromBody] MultilevelNmaEngine.MultilevelNmaRequest req) =>
{
    try { return Results.Ok(MultilevelNmaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- HSROC Model
app.MapPost("/api/dta/hsroc", ([FromBody] HsrocEngine.HsrocRequest req) =>
{
    try { return Results.Ok(HsrocEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Competing Risks Meta-Analysis
app.MapPost("/api/competing-risks", ([FromBody] CompetingRisksEngine.CompetingRisksRequest req) =>
{
    try { return Results.Ok(CompetingRisksEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Multi-Arm NMA Correction
app.MapPost("/api/nma/multiarm", ([FromBody] MultiArmNmaEngine.MultiArmRequest req) =>
{
    try { return Results.Ok(MultiArmNmaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Qualitative Meta-Synthesis
app.MapPost("/api/qualitative/meta", ([FromBody] QualitativeMetaEngine.QualitativeMetaRequest req) =>
{
    try { return Results.Ok(QualitativeMetaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Bubble Plot / Meta-Regression Scatter Plot
app.MapPost("/api/figure/bubble", ([FromBody] BubblePlotEngine.BubblePlotRequest req) =>
{
    try { return Results.Ok(BubblePlotEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- League Matrix Heatmap
app.MapPost("/api/figure/league-matrix", ([FromBody] LeagueMatrixEngine.LeagueMatrixRequest req) =>
{
    try { return Results.Ok(LeagueMatrixEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- PRISMA-DTA Flow Diagram
app.MapPost("/api/prisma-dta", ([FromBody] PrismaDtaEngine.PrismaDtaRequest req) =>
{
    try { return Results.Ok(PrismaDtaEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Living Review Automation
app.MapPost("/api/living/automate", ([FromBody] LivingReviewAutomationEngine.LivingReviewConfig req) =>
{
    try
    {
        // In production, this would fetch from PubMed/OpenAlex
        // For now, return the automation status
        return Results.Ok(LivingReviewAutomationEngine.Run(req, new List<string>()));
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Bayesian Network Meta-Analysis
app.MapPost("/api/bayesian-nma", ([FromBody] BayesianNmaEngine.BayesianNmaRequest req) =>
{
    try { return Results.Ok(BayesianNmaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Umbrella Review
app.MapPost("/api/umbrella", ([FromBody] UmbrellaReviewEngine.UmbrellaRequest req) =>
{
    try { return Results.Ok(UmbrellaReviewEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- IPD from KM Reconstruction
app.MapPost("/api/ipd/from-km", ([FromBody] IpdFromKmEngine.IpdFromKmRequest req) =>
{
    try { return Results.Ok(IpdFromKmEngine.Reconstruct(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Robust Variance Estimation
app.MapPost("/api/rve", ([FromBody] RveEngine.RveRequest req) =>
{
    try { return Results.Ok(RveEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- P-Value Combination Methods
app.MapPost("/api/pvalue/combine", ([FromBody] PValueCombinationEngine.PValueRequest req) =>
{
    try { return Results.Ok(PValueCombinationEngine.Combine(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Citation Deduplication
app.MapPost("/api/deduplicate", ([FromBody] List<DeduplicationEngine.Citation> req) =>
{
    try { return Results.Ok(DeduplicationEngine.Deduplicate(req ?? new())); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- RevMan 5 Import/Export
app.MapPost("/api/revman/import", async (HttpRequest req) =>
{
    try
    {
        using var sr = new StreamReader(req.Body);
        var raw = await sr.ReadToEndAsync();
        var json = System.Text.Json.JsonSerializer.Deserialize<RevManImportRequest>(raw,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new RevManImportRequest();

        RevManEngine.RevManProject project;
        if (json.format == "csv")
        {
            project = RevManEngine.ReadRm5Csv(json.content ?? "");
        }
        else
        {
            var tmp = Path.GetTempFileName();
            File.WriteAllText(tmp, json.content ?? string.Empty, Encoding.UTF8);
            project = RevManEngine.ReadRm5(tmp);
            File.Delete(tmp);
        }
        return Results.Ok(project);
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

app.MapPost("/api/revman/export", async (HttpRequest req) =>
{
    try
    {
        using var sr = new StreamReader(req.Body);
        var raw = await sr.ReadToEndAsync();
        var revManReq = System.Text.Json.JsonSerializer.Deserialize<RevManEngine.RevManProject>(raw,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var csv = RevManEngine.WriteRm5Csv(revManReq ?? new RevManEngine.RevManProject());
        return Results.File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "revman_export.csv");
    }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Bayesian Model-Averaged Meta-Analysis
app.MapPost("/api/bma", ([FromBody] BayesianModelAveragingEngine.BmmaRequest req) =>
{
    try { return Results.Ok(BayesianModelAveragingEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Phylogenetic Meta-Analysis
app.MapPost("/api/phylo", ([FromBody] PhylogeneticMaEngine.PhyloRequest req) =>
{
    try { return Results.Ok(PhylogeneticMaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Multivariate Dose-Response
app.MapPost("/api/dose/multivariate", ([FromBody] MultivariateDoseResponseEngine.MultiDoseRequest req) =>
{
    try { return Results.Ok(MultivariateDoseResponseEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Network Meta-Regression
app.MapPost("/api/nma/regression", ([FromBody] NetworkMetaRegressionEngine.NmaRegressionRequest req) =>
{
    try { return Results.Ok(NetworkMetaRegressionEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- GRADE Summary of Findings
app.MapPost("/api/grade/sof-table", ([FromBody] GradeSoFGenerator.GradeRequest req) =>
{
    try { return Results.Ok(GradeSoFGenerator.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Citation Network Analysis
app.MapPost("/api/citation/network", ([FromBody] CitationNetworkEngine.CitationNetworkRequest req) =>
{
    try { return Results.Ok(CitationNetworkEngine.Analyze(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Bucher Indirect Comparison
app.MapPost("/api/bucher", ([FromBody] BucherIndirectComparisonEngine.BucherRequest req) =>
{
    try { return Results.Ok(BucherIndirectComparisonEngine.Compare(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Component Network Meta-Analysis
app.MapPost("/api/cnma", ([FromBody] ComponentNmaEngine.CnmaRequest req) =>
{
    try { return Results.Ok(ComponentNmaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- PRISMA-ScR Flow Diagram
app.MapPost("/api/scr/flow", ([FromBody] PrismaScrEngine.PrismaScrRequest req) =>
{
    try { return Results.Ok(PrismaScrEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Spatio-Temporal Meta-Analysis
app.MapPost("/api/spatiotemporal", ([FromBody] SpatioTemporalEngine.SpatioTemporalRequest req) =>
{
    try { return Results.Ok(SpatioTemporalEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Response Surface Meta-Analysis
app.MapPost("/api/response-surface", ([FromBody] ResponseSurfaceEngine.ResponseSurfaceRequest req) =>
{
    try { return Results.Ok(ResponseSurfaceEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Zotero Sync
app.MapPost("/api/zotero/connect", ([FromBody] ZoteroSyncEngine.ZoteroConfig req) =>
{
    try { return Results.Ok(ZoteroSyncEngine.Connect(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/zotero/import", ([FromBody] ZoteroSyncEngine.ZoteroConfig req) =>
{
    try { return Results.Ok(ZoteroSyncEngine.Import(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/zotero/export", ([FromBody] ZoteroSyncEngine.ZoteroConfig req) =>
{
    try { return Results.Ok(ZoteroSyncEngine.Export(req, new List<ZoteroSyncEngine.ZoteroItem>())); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Mendeley Sync
app.MapPost("/api/mendeley/connect", ([FromBody] MendeleySyncEngine.MendeleyConfig req) =>
{
    try { return Results.Ok(MendeleySyncEngine.Connect(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/mendeley/import", ([FromBody] MendeleySyncEngine.MendeleyConfig req) =>
{
    try { return Results.Ok(MendeleySyncEngine.Import(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.MapPost("/api/mendeley/export", ([FromBody] MendeleySyncEngine.MendeleyConfig req) =>
{
    try { return Results.Ok(MendeleySyncEngine.Export(req, new List<MendeleySyncEngine.MendeleyDocument>())); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- Risk of Bias 2
app.MapPost("/api/rob2", ([FromBody] RoB2Engine.RoB2Request req) =>
{
    try { return Results.Ok(RoB2Engine.Evaluate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- ROBINS-I
app.MapPost("/api/robins-i", ([FromBody] RobinsIEngine.RobinsIRequest req) =>
{
    try { return Results.Ok(RobinsIEngine.Evaluate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- QUADAS-2
app.MapPost("/api/quadas-2", ([FromBody] Quadas2Engine.Quadas2Request req) =>
{
    try { return Results.Ok(Quadas2Engine.Evaluate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- AMSTAR-2
app.MapPost("/api/amstar-2", ([FromBody] Amstar2Engine.Amstar2Request req) =>
{
    try { return Results.Ok(Amstar2Engine.Evaluate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- Newcastle-Ottawa Scale
app.MapPost("/api/nos", ([FromBody] NewcastleOttawaEngine.NosRequest req) =>
{
    try { return Results.Ok(NewcastleOttawaEngine.Evaluate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.7.0 -- GRADE Evidence Profile
app.MapPost("/api/grade/evidence-profile", ([FromBody] GradeEvidenceProfileEngine.GradeRequest req) =>
{
    try { return Results.Ok(GradeEvidenceProfileEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- SUCRA (Surface Under Cumulative Ranking) with bootstrap CIs
app.MapPost("/api/sucra", ([FromBody] SucraEngine.SucraRequest req) =>
{
    try { return Results.Ok(SucraEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Cumulative Meta-Analysis Forest Plot with trendline
app.MapPost("/api/figure/cumulative-forest", ([FromBody] CumulativeForestEngine.CumulativeRequest req) =>
{
    try { return Results.Ok(CumulativeForestEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Diagnostic Odds Ratio Forest & Moses-Littenberg SROC
app.MapPost("/api/dta/dor-forest", ([FromBody] DiagnosticOrForestEngine.DorRequest req) =>
{
    try { return Results.Ok(DiagnosticOrForestEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Cluster-Robust Egger publication bias test
app.MapPost("/api/clusterrobust/egger", ([FromBody] ClusterRobustEggerEngine.EggerRequest req) =>
{
    try { return Results.Ok(ClusterRobustEggerEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- DBSCAN Funnel Cluster Detection & Fail-Safe N
app.MapPost("/api/cluster/detect", ([FromBody] ClusterDetectionEngine.ClusterRequest req) =>
{
    try { return Results.Ok(ClusterDetectionEngine.DetectClusters(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// Engine -- Powerhouse P-value combination suite
app.MapPost("/api/powerhouse/pvalue-combine", ([FromBody] PowerhouseEngine.PvalCombineRequest req) =>
{
    try { return Results.Ok(PowerhouseEngine.CombinePvalues(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// v0.6.1 — Complete Coverage Engines
// ═══════════════════════════════════════════════════════════════════════════

// ── Bayesian Multilevel ────────────────────────────────────────────────
app.MapPost("/api/bayesian-multilevel", ([FromBody] BayesianMultilevelEngine.MultilevelRequest req) =>
{
    try { return Results.Ok(BayesianMultilevelEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// ── Bayesian DTA ──────────────────────────────────────────────────────
app.MapPost("/api/bayesian-dta", ([FromBody] BayesianDtaEngine.BayesianDtaRequest req) =>
{
    try { return Results.Ok(BayesianDtaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});










// v0.6.1 — Bayesian Prognostic
app.MapPost("/api/bayesian-prognostic", ([FromBody] BayesianPrognosticEngine.PrognosticRequest req) =>
{
    try { return Results.Ok(BayesianPrognosticEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.6.1 — MCMC Diagnostics
app.MapPost("/api/mcmc/diagnostics", ([FromBody] McmcDiagnosticsEngine.McmcRequest req) =>
{
    try { return Results.Ok(McmcDiagnosticsEngine.Diagnose(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.6.1 — Qualitative Synthesis
app.MapPost("/api/qualitative/synthesis", ([FromBody] QualitativeSynthesisEngine.QualRequest req) =>
{
    try { return Results.Ok(QualitativeSynthesisEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.6.1 — Profile Likelihood CI
app.MapPost("/api/profile-likelihood", ([FromBody] ProfileLikelihoodEngine.PlRequest req) =>
{
    try { return Results.Ok(ProfileLikelihoodEngine.Compute(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});



// v0.6.1 — Network Graph SVG
app.MapPost("/api/nma/graph", ([FromBody] NetworkGraphEngine.GraphRequest req) =>
{
    try { return Results.Ok(NetworkGraphEngine.Generate(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});

// v0.6.1 — Time-Series Meta-Analysis (with interrupted time-series)
app.MapPost("/api/time-series", ([FromBody] TimeSeriesMetaEngine.TsRequest req) =>
{
    try { return Results.Ok(TimeSeriesMetaEngine.Run(req)); }
    catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
});
app.Run();
