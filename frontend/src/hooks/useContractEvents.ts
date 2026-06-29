import { useEffect } from 'react';
import { rpc } from '@stellar/stellar-sdk';
import { toast } from 'sonner';

const SERVER_URL = "https://soroban-testnet.stellar.org";
const CONTRACT_ID = "CAYJUZTTDE3IOSJAH6TA4ZJ4QSAXBT2MKV3RGVOFZCVLE43WYP2ZXFD6";

export function useContractEvents() {
  useEffect(() => {
    let isMounted = true;
    let lastLedger = 0;
    const server = new rpc.Server(SERVER_URL);

    const pollEvents = async () => {
      try {
        if (lastLedger === 0) {
          const latestLedgerResp = await server.getLatestLedger();
          lastLedger = latestLedgerResp.sequence;
        }

        const eventsResp = await server.getEvents({
          startLedger: lastLedger,
          filters: [
            {
              type: "contract",
              contractIds: [CONTRACT_ID],
            }
          ],
          limit: 10
        });

        if (eventsResp.events && eventsResp.events.length > 0) {
          eventsResp.events.forEach(event => {
            if (event.type === 'contract' && event.topic) {
              const topicVal = event.topic[0]?.toCV()?.value();
              const eventType = topicVal ? topicVal.toString() : "Unknown Event";
              
              if (eventType === "init") {
                toast.success("🎉 Smart Contract: New Escrow Initialized!");
              } else if (eventType === "submit") {
                toast.success("✅ Smart Contract: Milestone Submitted!");
              } else if (eventType === "approve") {
                toast.success("💰 Smart Contract: Milestone Approved & Funds Released!");
              } else if (eventType === "dispute") {
                toast.error("⚠️ Smart Contract: Dispute Raised!");
              } else if (eventType === "revision") {
                toast.error("🔄 Smart Contract: Revision Requested!");
              } else {
                toast(`🔗 Smart Contract Event: ${eventType}`);
              }
            }
          });
          
          const highestLedger = Math.max(...eventsResp.events.map(e => e.ledger));
          lastLedger = highestLedger + 1;
        }
      } catch (e) {
        console.warn("Event polling error:", e);
      }
      
      if (isMounted) {
        setTimeout(pollEvents, 5000);
      }
    };

    pollEvents();

    return () => {
      isMounted = false;
    };
  }, []);
}
