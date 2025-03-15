// npx esrun codama-script/generate-client.ts
// script to generate the codama client sdks from the anchor idl
// this generates both the js
import { createFromRoot, updateProgramsVisitor } from "codama";
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";
import Idl from "./idl.json";

const rootNode = rootNodeFromAnchor(Idl as AnchorIdl);
const codama = createFromRoot(rootNode);
codama.update(
  updateProgramsVisitor({
    counterProgram: { name: "counter" },
  })
);

// Generate the client sdks at the given path
codama.accept(renderJavaScriptVisitor("./sdk"));
