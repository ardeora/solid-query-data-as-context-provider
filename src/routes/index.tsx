import { redirect, RouteLoadFuncArgs, useSearchParams } from "@solidjs/router";
import { isServer } from "solid-js/web";
import {
  createQuery,
  QueryFunctionContext,
  useQueryClient,
} from "@tanstack/solid-query";
import {
  createContext,
  createEffect,
  onCleanup,
  onMount,
  Show,
  Suspense,
  useContext,
} from "solid-js";

type QueryResultType = { message: string };

const queryOneServerFunction = async (
  ctx: QueryFunctionContext["queryKey"]
): Promise<QueryResultType> => {
  "use server";
  console.debug("queryOne server call", ctx);
  return { message: `${ctx}` };
};

const dataContext = createContext<() => QueryResultType | undefined>();

// actual page
export default function TestReactivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = () => Number(searchParams.id ?? 0);

  const queryOne = createQuery(() => ({
    queryKey: ["queryOne", id()] as const,
    queryFn: async (ctx) => {
      return queryOneServerFunction(ctx.queryKey);
    },
    staleTime: 20 * 1000,
    placeholderData: (d) => d,
  }));

  createEffect(() => {
    console.debug(
      "queryOne state",
      queryOne.status,
      queryOne.isFetching,
      queryOne.isSuccess,
      queryOne.isError,
      queryOne
    );
    console.debug(
      "queryOne data",
      queryOne.data,
      JSON.stringify(queryOne.data)
    );
  });

  onMount(() => {
    const timer = setInterval(() => {
      let nextId = id() + 1;
      if (nextId === 11) {
        nextId = 1;
      }

      setSearchParams({ id: nextId });
    }, 3000);

    onCleanup(() => clearInterval(timer));
  });

  return (
    <>
      <div>
        <div>Test Reactivity</div>
        <br />
        <Suspense>
          <div>
            <Show when={queryOne.data}>
              <div>tanStack in component: {queryOne.data?.message ?? ""}</div>
            </Show>
            <dataContext.Provider value={() => queryOne.data}>
              <SubComponent />
            </dataContext.Provider>
          </div>
        </Suspense>
        <br />
        <div>Test Reactivity</div>
      </div>
    </>
  );
}

function SubComponent() {
  const data = useContext(dataContext);
  console.debug("IS IT A PROXY", data);

  return (
    <>
      <div>Using provider: {data?.()?.message}</div>
    </>
  );
}
