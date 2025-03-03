import { useEffect, useState } from "react";
import * as SwaggerParser from "@apidevtools/swagger-parser";
import { Collection } from "postman-collection";
import { buildSchema, buildClientSchema, GraphQLSchema } from "graphql";
import { parse } from "yaml";
import openapiJson from "@/assets/openapi.json?raw";
import openapiYaml from "@/assets/openapi.yml?raw";
import postmanJson from "@/assets/postman.json?raw";
import graphqlIntrospection from "@/assets/graphql-introspection.json?raw";
import graphqlSdl from "@/assets/graphql-sdl.graphql?raw";
const sampleSchemas = {
  "openapi-json": openapiJson,
  "openapi-yaml": openapiYaml,
  "postman-json": postmanJson,
  "graphql-introspection": graphqlIntrospection,
  "graphql-sdl": graphqlSdl,
};

export type SchemaTypes = "openapi" | "postman" | "graphql" | "unknown";
interface Analytics {
  totalEndpoints: number;
  totalQueries: number;
  totalMutations: number;
}

interface Endpoint {
  title: string;
  content: any;
}

export interface ParsedSchema {
  type: SchemaTypes;
  analytics: Analytics;
  endpoints: Endpoint[];
}

export async function parseSchema(content: string): Promise<ParsedSchema> {
  let totalEndpoints = 0;
  let totalQueries = 0;
  let totalMutations = 0;

  let endpoints: Endpoint[] = [];
  try {
    let type: SchemaTypes = "unknown";
    let data: any = content;
    try {
      const json = JSON.parse(content);
      data = json;
      if (json.openapi) {
        type = "openapi";
      } else if (json.info && json.item) {
        type = "postman";
      } else if (json.data && json.data.__schema) {
        type = "graphql";
      }
    } catch (error) {
      try {
        const yaml = parse(content);
        if (yaml.openapi) {
          type = "openapi";
          data = yaml;
        }
      } catch (error) {
        if (content.includes("schema {")) {
          type = "graphql";
        }
      }
    }
    switch (type) {
      case "openapi":
        {
          const api = await SwaggerParser.parse(data);
          for (const path in api.paths) {
            const pathItem = api.paths[path];
            pathItem?.parameters
            for (const method in pathItem) {
              if (method === "parameters") {
                continue;
              }
              totalEndpoints++;
              if (method.toLowerCase() === "get") {
                totalQueries++;
              } else {
                console.log(pathItem);
                totalMutations++;
              }
              const operation = (pathItem as any)[method];
              const title = `${method.toUpperCase()} ${path}`;
              endpoints.push({ title, content: operation });
            }
          }
        }
        break;

      case "postman":
        {
          const collection = new Collection(data);
          collection.forEachItem((requestItem) => {
            totalEndpoints++;
            const method = requestItem.request.method.toLowerCase();
            if (method === "get") {
              totalQueries++;
            } else {
              totalMutations++;
            }
            const title = `${method.toUpperCase()} ${requestItem.name.toString()}`;
            const content = requestItem.request.toJSON();
            endpoints.push({ title, content });
          });
        }
        break;

      case "graphql":
        {
          let schema: GraphQLSchema;
          try {
            schema = buildClientSchema(data.data);
          } catch (error) {
            schema = buildSchema(content);
          }
          const queryType = schema.getQueryType();
          const mutationType = schema.getMutationType();
          const queries = queryType ? queryType.getFields() : {};
          const mutations = mutationType ? mutationType.getFields() : {};
          totalQueries = Object.keys(queries).length;
          totalMutations = Object.keys(mutations).length;
          totalEndpoints = totalQueries + totalMutations;
          ["Query", "Mutation"].forEach((type) => {
            for (const [key, value] of Object.entries(
              type === "Query" ? queries : mutations
            )) {
              const content = {
                name: value.name,
                description: value.description,
                args: value.args.map((arg) => ({
                  name: arg.name,
                  type: arg.type.toString(),
                  defaultValue: arg.defaultValue,
                  description: arg.description,
                })),
                type: value.type.toString(),
              };
              endpoints.push({
                title: `${type}: ${key}`,
                content,
              });
            }
          });
        }
        break;
      default:
        break;
    }
    return {
      type,
      analytics: { totalEndpoints, totalQueries, totalMutations },
      endpoints,
    };
  } catch (error) {
    console.error(error);
    return {
      type: "unknown",
      analytics: { totalEndpoints: 0, totalQueries: 0, totalMutations: 0 },
      endpoints: [],
    } as ParsedSchema;
  }
}

const defaultParsedSchema: ParsedSchema = {
  type: "unknown",
  analytics: {
    totalEndpoints: 0,
    totalQueries: 0,
    totalMutations: 0,
  },
  endpoints: [],
};

function App() {
  const [schema, setSchema] = useState<string>("");
  const [parsedSchema, setParsedSchema] =
    useState<ParsedSchema>(defaultParsedSchema);
  useEffect(() => {
    if (schema) {
      parseSchema(schema).then((value) => setParsedSchema(value));
    }
  }, [schema]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
      <div className="flex flex-col space-y-2.5 pt-2.5">
        <div className="flex justify-between">
          <select
          key={`select-schema-${schema.length}`}
            id="countries"
            onChange={(e) =>
              setSchema(
                sampleSchemas[e.target.value as keyof typeof sampleSchemas]
              )
            }
            className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg  block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white  opacity-75 hover:opacity-100"
          >
            <option value="select" disabled selected>
              Select Sample Schema
            </option>
            {[
              {
                value: "openapi-json",
                label: "OpenAPI (JSON)",
              },
              {
                value: "openapi-yaml",
                label: "OpenAPI (YAML)",
              },
              {
                value: "postman-json",
                label: "Postman (JSON)",
              },
              {
                value: "graphql-introspection",
                label: "GraphQL (Introspection)",
              },
              {
                value: "graphql-sdl",
                label: "GraphQL (SDL)",
              },
            ].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label
            htmlFor="schema-upload"
            className="items-center justify-center gap-2 whitespace-nowrap bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg  block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white  opacity-75 hover:opacity-100 cursor-pointer"
          >
            Upload Schema
          </label>
          <input
            type="file"
            className="hidden"
            id="schema-upload"
            placeholder="Upload Schema"
            onChange={(e) => {
              const file = e.target.files?.[0];
              const reader = new FileReader();
              reader.onload = (e) => {
                setSchema(e.target?.result as string);
              };
              if (file) {
                reader.readAsText(file);
              }
            }}
          />
        </div>
        <div className="relative pt-5">
          <div
            className={`absolute z-50 top-6 right-5 text-xs text-white p-2.5 rounded-full border ${parsedSchema.type ===
              "openapi"
                ? "bg-green-500"
                : parsedSchema.type === "postman"
                ? "bg-orange-500"
                : parsedSchema.type === "graphql"
                ? "bg-pink-500"
                : parsedSchema.type === "unknown"
                ? "hidden"
                : "hidden"}`}
          >
            {parsedSchema.type}
          </div>
          <textarea
            placeholder="Paste your schema here"
            className="min-h-[40vh] md:h-[85vh] w-full px-5 pb-5"
            value={schema}
            onChange={(e) => {
              setSchema(e.target.value);
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
        <div className="">
          <h2 className="text-lg font-semibold">Endpoints</h2>
          <p className="text-3xl font-semibold">
            {parsedSchema.analytics.totalEndpoints}
          </p>
        </div>
        <div className="">
          <h2 className="text-lg font-semibold">Queries</h2>
          <p className="text-3xl font-semibold">
            {parsedSchema.analytics.totalQueries}
          </p>
        </div>
        <div className="">
          <h2 className="text-lg font-semibold">Mutations</h2>
          <p className="text-3xl font-semibold">
            {parsedSchema.analytics.totalMutations}
          </p>
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-3 h-[82vh] overflow-scroll">
          {parsedSchema.endpoints.map((endpoint, index) => (
            <div key={`endpoint-${index}`}>
              <div className="bg-white px-4 pb-4 rounded-lg flex space-x-2.5 items-center">
                <span className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded p-1 min-w-7 text-center">
                  {index + 1}
                </span>
                <h2 className="text-sm font-semibold">{endpoint.title}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
