import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Dashboard from "../../pages/Dashboard";
import { emptyProject } from "../project";

describe("review overview", () => {
  it("starts an empty review at the research question", () => {
    const html = renderToStaticMarkup(<Dashboard project={emptyProject()} onChange={() => {}} />);
    expect(html).toContain("Define your research question");
  });
  it("keeps unresolved conflicts in screening even when every record has a decision", () => {
    const project = emptyProject();
    project.pico.population = "Adults";
    project.screening.title_abstract = [{ id: "one", title: "Trial", abstract: "", stage: "title_abstract", decision: "include", conflictStatus: "pending" }];
    project.screening.full_text = [{ ...project.screening.title_abstract[0], stage: "full_text" }];
    const html = renderToStaticMarkup(<Dashboard project={project} onChange={() => {}} />);
    expect(html).toContain("Continue screening");
    expect(html).toContain("References imported</span><strong>1</strong>");
    expect(html).toContain("2 unresolved conflicts");
  });
});
