import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { History } from "./-utils";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const [history, setHistory] = useLocalStorage<History>("history", []);
  return (
    <Table>
      <TableHeader>
        <TableHead>End Time</TableHead>
        <TableHead>Time Focused</TableHead>
      </TableHeader>
      <TableBody>
        {history.length == 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              No history found
            </TableCell>
          </TableRow>
        ) : (
          history.map((item) => (
            <TableRow key={item.endTimeMillis}>
              <TableCell>
                {new Date(item.endTimeMillis).toLocaleString()}
              </TableCell>
              <TableCell>{item.focusedSeconds}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
