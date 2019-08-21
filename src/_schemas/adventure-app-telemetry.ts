
export interface DBTelemetry {
  id: string;
  date: number;
  function_name: string;
  user_id?: string;
  headers: { [name: string]: string };
  parameters: {
    path: { [name: string]: string } | null;
    query: { [name: string]: string } | null;
  };
  body: string | null;
}
