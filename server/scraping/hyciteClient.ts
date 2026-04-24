import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";

export interface HyCiteCredentials {
  username: string;
  password: string;
  otpCode?: string;
}

export interface HyCiteSalesData {
  date: string;
  amount: number;
  status: string;
  details: string;
}

export interface HyCiteOrderData {
  orderId: string;
  date: string;
  status: string;
  items: number;
  total: number;
}

export interface HyCiteMetrics {
  totalSales: number;
  pendingOrders: number;
  completedOrders: number;
  accountStatus: string;
}

/**
 * HyCite Client - Handles scraping and data extraction from HyCite backoffice
 * Supports both manual OTP entry and automatic OTP retrieval
 */
export class HyCiteClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly baseUrl = "https://distributors.hycite.com";
  private readonly loginUrl = "https://auth.hycite.com/as/authorize?client_id=623c8be8-84c7-48d7-b7c6-bd8a298a0e55&redirect_uri=https%3A%2F%2Fdistributors.hycite.com%2F&response_type=code%20id_token%20token&scope=openid%20hcdistwebapi&state=OpenIdConnect.AuthenticationProperties%3D1ZTGsS7rbfmf5QRl-35P4cv1c_0fw1YoyVBXbGjYVUwPXgUsKbxlaV2qAoX6CZeb4UPY8q8qm1iomo2KCCkcJzJIhLafE9ZYG6x0ytC0R--Ye1U0QLP_3gq9xL8gYTnimbOnK-KlTdj-5wlCmNQUPSeCeUquKoV772sVEWJHQUS0HfhPL0o5dhX4Fmg9G2K0qSW3ts-TacwTaMAIuMuEDq01e2d96GABX2-Bm4QfZLI&response_mode=form_post&nonce=639126476379623807.ZGYyN2Q0NjUtNWI2Ny00YmI4LTkwMjAtOWM0OGE0Yjg2MjcyYWE0N2QyYTAtMTIzZS00Y2E1LWE0MDgtMzczZjI3MzcyMWY5&post_logout_redirect_uri=https%3A%2F%2Fdistributors.hycite.com%2F&ui_locales=es-MX&x-client-SKU=ID_NET472&x-client-ver=7.0.3.0";

  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(30000);
      this.page.setDefaultNavigationTimeout(30000);
    } catch (error) {
      console.error("[HyCiteClient] Failed to initialize browser:", error);
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Login to HyCite with username and password
   * Returns session token/cookie for future requests
   */
  async loginWithCredentials(credentials: HyCiteCredentials): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      // Navigate to login page
      await this.page.goto(this.loginUrl, { waitUntil: "networkidle2" });

      // Fill username
      await this.page.type('input[id*="react-aria"]', credentials.username, { delay: 50 });

      // Fill password
      const passwordInputs = await this.page.$$('input[type="password"]');
      if (passwordInputs.length > 0) {
        await this.page.evaluate((input) => {
          (input as HTMLInputElement).value = "";
        }, passwordInputs[0]);
        await this.page.type('input[type="password"]', credentials.password, { delay: 50 });
      }

      // Click sign on button
      await this.page.click('button:has-text("Sign On")');

      // Wait for OTP page or success
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {
        // Navigation might not happen if OTP is required
      });

      // Get session cookies
      const cookies = await this.page.cookies();
      const sessionCookie = cookies.find((c) => c.name.includes("session") || c.name.includes("auth"));

      if (!sessionCookie) {
        throw new Error("No session cookie found after login");
      }

      return JSON.stringify(cookies);
    } catch (error) {
      console.error("[HyCiteClient] Login failed:", error);
      throw error;
    }
  }

  /**
   * Submit OTP code for two-factor authentication
   */
  async submitOTP(otpCode: string): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      // Look for OTP input field
      const otpInputs = await this.page.$$('input[type="text"]');
      if (otpInputs.length === 0) {
        throw new Error("OTP input field not found");
      }

      // Fill OTP
      await this.page.evaluate((input, code) => {
        (input as HTMLInputElement).value = code;
      }, otpInputs[0], otpCode);

      // Submit OTP
      const submitButtons = await this.page.$$("button");
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
      }

      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 });

      // Get session cookies
      const cookies = await this.page.cookies();
      return JSON.stringify(cookies);
    } catch (error) {
      console.error("[HyCiteClient] OTP submission failed:", error);
      throw error;
    }
  }

  /**
   * Restore session from saved cookies
   */
  async restoreSession(sessionData: string): Promise<void> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      const cookies = JSON.parse(sessionData);
      await this.page.setCookie(...cookies);

      // Navigate to dashboard to verify session is valid
      await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });

      // Check if we're still logged in
      const currentUrl = this.page.url();
      if (currentUrl.includes("auth.hycite.com")) {
        throw new Error("Session expired");
      }
    } catch (error) {
      console.error("[HyCiteClient] Session restore failed:", error);
      throw error;
    }
  }

  /**
   * Extract sales data from the dashboard
   */
  async extractSalesData(): Promise<HyCiteSalesData[]> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      // Navigate to sales page
      await this.page.goto(`${this.baseUrl}/sales`, { waitUntil: "networkidle2" });

      // Get page content
      const content = await this.page.content();
      const $ = cheerio.load(content);

      const salesData: HyCiteSalesData[] = [];

      // Parse sales table (adjust selectors based on actual HyCite structure)
      $("table tbody tr").each((_, element) => {
        const cells = $(element).find("td");
        if (cells.length >= 4) {
          salesData.push({
            date: $(cells[0]).text().trim(),
            amount: parseFloat($(cells[1]).text().replace(/[^0-9.-]/g, "")),
            status: $(cells[2]).text().trim(),
            details: $(cells[3]).text().trim(),
          });
        }
      });

      return salesData;
    } catch (error) {
      console.error("[HyCiteClient] Sales extraction failed:", error);
      throw error;
    }
  }

  /**
   * Extract orders data from the dashboard
   */
  async extractOrdersData(): Promise<HyCiteOrderData[]> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      // Navigate to orders page
      await this.page.goto(`${this.baseUrl}/orders`, { waitUntil: "networkidle2" });

      const content = await this.page.content();
      const $ = cheerio.load(content);

      const ordersData: HyCiteOrderData[] = [];

      // Parse orders table
      $("table tbody tr").each((_, element) => {
        const cells = $(element).find("td");
        if (cells.length >= 5) {
          ordersData.push({
            orderId: $(cells[0]).text().trim(),
            date: $(cells[1]).text().trim(),
            status: $(cells[2]).text().trim(),
            items: parseInt($(cells[3]).text()),
            total: parseFloat($(cells[4]).text().replace(/[^0-9.-]/g, "")),
          });
        }
      });

      return ordersData;
    } catch (error) {
      console.error("[HyCiteClient] Orders extraction failed:", error);
      throw error;
    }
  }

  /**
   * Extract metrics from the dashboard
   */
  async extractMetrics(): Promise<HyCiteMetrics> {
    if (!this.page) throw new Error("Browser not initialized");

    try {
      // Navigate to dashboard
      await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });

      const content = await this.page.content();
      const $ = cheerio.load(content);

      // Extract metrics from dashboard cards (adjust selectors based on actual structure)
      const metrics: HyCiteMetrics = {
        totalSales: 0,
        pendingOrders: 0,
        completedOrders: 0,
        accountStatus: "active",
      };

      // Parse metric cards
      $("[data-metric]").each((_, element) => {
        const metricType = $(element).attr("data-metric");
        const value = $(element).find("[data-value]").attr("data-value");

        if (metricType === "total-sales" && value) {
          metrics.totalSales = parseFloat(value);
        } else if (metricType === "pending-orders" && value) {
          metrics.pendingOrders = parseInt(value);
        } else if (metricType === "completed-orders" && value) {
          metrics.completedOrders = parseInt(value);
        }
      });

      return metrics;
    } catch (error) {
      console.error("[HyCiteClient] Metrics extraction failed:", error);
      throw error;
    }
  }

  /**
   * Check if current session is still valid
   */
  async isSessionValid(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const response = await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });
      const currentUrl = this.page.url();

      // If redirected to login, session is invalid
      return !currentUrl.includes("auth.hycite.com");
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create and initialize a HyCite client
 */
export async function createHyCiteClient(): Promise<HyCiteClient> {
  const client = new HyCiteClient();
  await client.initialize();
  return client;
}
