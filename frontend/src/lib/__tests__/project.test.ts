import { describe, expect, it } from "vitest";
import { emptyProject, normalizeProject } from "../project";

describe("project migration", () => {
  it("preserves research sections and identity across reopen", () => {
    const project = emptyProject();
    project.metadata.studyType = "network";
    project.network = { treatments: ["A", "B"], comparisons: [], results: null };
    project.ipd = { datasets: [{ name: "Trial", rows: [{ id: 1 }] }], results: null };
    project.manuscript = { sections: { methods: "Our methods" }, sectionMetas: { methods: { assignedTo: "reviewer-1", status: "review" } } };
    project.extraction.studies = ["proportion", "rate", "correlation", "generic"].map(type => ({ study: type, type: type as "generic" }));
    const restored = normalizeProject(JSON.parse(JSON.stringify(project)));
    expect(restored.metadata).toEqual(project.metadata);
    expect(restored.network).toEqual(project.network);
    expect(restored.ipd).toEqual(project.ipd);
    expect(restored.manuscript?.sections).toEqual(project.manuscript.sections);
    expect(restored.extraction.studies).toEqual(project.extraction.studies);
  });
  it("assigns stable identity after migrating an old project", () => {
    const migrated = normalizeProject({ metadata: { title: "Legacy" } });
    expect(migrated.metadata.id).toBeTruthy();
    expect(normalizeProject(migrated).metadata.id).toBe(migrated.metadata.id);
    expect(emptyProject().metadata.id).not.toBe(migrated.metadata.id);
  });
});
