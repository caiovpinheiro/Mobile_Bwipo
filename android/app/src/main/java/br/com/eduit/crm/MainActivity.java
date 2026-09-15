package br.com.eduit.crm;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

// Pedidos de RECORD_AUDIO/CAMERA em runtime (getUserMedia dentro do WebView)
// já são tratados pelo BridgeWebChromeClient do Capacitor 6+ via
// onPermissionRequest, desde que a permissão exista no AndroidManifest.
// Nenhum código extra é necessário aqui — o bridge intercepta o prompt do
// WebView e repassa pro diálogo nativo de permissão do Android.
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // registerPlugin precisa rodar ANTES de super.onCreate — é nesse
    // ponto que a Bridge é criada e lê a lista de plugins registrados
    // (ver AGENT.md § Atualizar sem APK).
    registerPlugin(AppUpdatePlugin.class);
    super.onCreate(savedInstanceState);

    // Faixa do sistema (hora/wifi/bateria) acima do CRM: o WebView
    // desenha atras da status bar e ganha padding = altura da barra.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    getWindow().setStatusBarColor(Color.TRANSPARENT);

    // NextAuth (cookies Secure + SameSite=Lax) no WebView remoto: sem isto
    // o login "parece" OK e a sessão some no próximo navigation → volta
    // pra /login. Aceitar cookies (incl. 3rd-party no WebView) é requisito
    // do Chromium embutido no Android.
    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);
    if (this.bridge != null && this.bridge.getWebView() != null) {
      WebView webView = this.bridge.getWebView();
      cookieManager.setAcceptThirdPartyCookies(webView, true);
      webView.setBackgroundColor(Color.parseColor("#0d1b3e"));
      ViewCompat.setOnApplyWindowInsetsListener(webView, (View v, WindowInsetsCompat windowInsets) -> {
        Insets status = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
        int minTop = Math.round(47f * v.getResources().getDisplayMetrics().density);
        v.setPadding(0, Math.max(status.top, minTop), 0, 0);
        return windowInsets;
      });
      ViewCompat.requestApplyInsets(webView);
    }
  }

  // O WebView só grava os cookies em disco de tempos em tempos. Ao fechar o
  // app pela lista de recentes o processo morre antes desse ciclo e a sessao
  // do NextAuth se perde. flush() forca a gravacao enquanto ainda da tempo.
  @Override
  public void onPause() {
    super.onPause();
    CookieManager.getInstance().flush();
  }
}
