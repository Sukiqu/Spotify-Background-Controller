# Spotify Background Controller — Türkçe kurulum rehberi

Sürüm 1.3.2 · [Proje tanıtımı](README.md) · [English](README-ENGLISH.md)

## Kurulumdan önce

Windows, Codex, kullanılabilir bir Node.js çalışma zamanı, Spotify Premium ve Spotify masaüstü uygulaması gerekir. Paketin bulunduğu bilgisayarda yerel bir Codex görevi kullanın. Yerleşik Spotify bağlantısı ayrı bir entegrasyondur.

## Kurulum

1. [Releases](https://github.com/Sukiqu/Spotify-Background-Controller/releases/latest) sayfasından **Spotify-Background-Controller-1.3.2.zip** dosyasını indirin.
2. ZIP'in tamamını kalıcı bir klasöre çıkarın. Bütün dosyaları birlikte tutun.
3. **Spotify Background Controller - Install.cmd** dosyasına çift tıklayın. İçeriğini PowerShell'e yapıştırmayın ve ZIP'in içinden çalıştırmayın.
4. Kurulumun başarıyla tamamlandığını kontrol edin; Codex'i tamamen kapatıp yeniden açın.
5. Yeni bir **yerel Codex görevi** başlatın ve Spotify masaüstü uygulamasını açın.

Kurulum betiği bilgisayarda Codex ile Node'u bulur ve `spotify-background` kaydını ekler. Bu ön gereksinimleri indirmez. Klasörü taşımak veya silmek kaydı bozar; taşıdıysanız yeni konumdan kurulumu yeniden çalıştırın.

## Spotify Client ID nasıl bulunur?

Client ID, geliştirici uygulamanızı tanımlar. Parola değildir ve tek başına hesabınıza erişim vermez. Proje OAuth Authorization Code with PKCE kullandığı için Client Secret gerekmez.

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) sayfasında Spotify hesabınızla oturum açın.
2. Mevcut uygulamanızı seçin veya kişisel controller için uygulama oluşturun. Hangi API'yi kullanacağınız sorulursa **Web API** seçin.
3. Uygulama ayarlarına girin. **Redirect URI** alanına aşağıdaki adresi aynen ekleyip kaydedin:

   `http://127.0.0.1:43821/callback`

4. Uygulamada gösterilen **Client ID** değerini kopyalayın. **Client Secret** değerini kopyalamayın.
5. Development Mode uygulamasına farklı bir Spotify hesabıyla bağlanılacaksa **Users and Access** izin listesini kontrol edin.

Spotify'ın [Development Mode sınırları](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) yeni uygulamalar için beş kullanıcı ve geliştirici başına bir Client ID sınırı içerir; uygulama sahibinin Premium hesabı olmalıdır. Önceden oluşturulan bazı uygulamalar mevcut ID ve kullanıcılarını koruyabilir. Uygunsa mevcut uygulamanızı kullanın.

Güncel koşullar için Spotify'ın [uygulama kurulumu](https://developer.spotify.com/documentation/web-api/concepts/apps) ve [Redirect URI kuralları](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri) belgelerine bakın. Yerel adres bu bilgisayarı gösterir ve kaydedilen ayarla eşleşmelidir.

## Codex üzerinden bağlanma

1. Şunu yazın: `Spotify Background Controller ile bağlan. Client ID: CLIENT_ID_DEĞERİNİZ`
2. Controller'ın verdiği yetkilendirme bağlantısını açın ve Spotify izinlerini onaylayın. Bağlantının süresi beş dakikadır.
3. Tarayıcıda **Spotify connected** yazınca Codex'e dönün: `Spotify Background Controller bağlantı durumunu kontrol et.`
4. `Spotify cihazlarımı listele.` deyin ve bilgisayarınızı tam cihaz adıyla seçin.
5. Deneyin: `CİHAZ_ADI üzerinde Skillet - Monster şarkısını çal.`

Controller'ın Developer Dashboard'a erişmesi gerekmez. Geliştirici uygulamasını siz ayarlarsınız; controller Client ID'yi alıp Spotify'ın izin bağlantısını döndürür. Client Secret, parola, yetkilendirme kodu veya token göndermeyin.

## Örnek komutlar

Komutları yazabilir veya Codex oturumunuz sesli kullanımı destekliyorsa söyleyebilirsiniz. İsimleri ve `CİHAZ_ADI` alanını kendi değerlerinizle değiştirin.

| İşlem | Örnek |
| --- | --- |
| Bağlantıyı kontrol etme | “Spotify Background Controller bağlantı durumunu kontrol et.” |
| Bağlanma | “Spotify Background Controller ile bağlan. Client ID: CLIENT_ID_DEĞERİNİZ” |
| Cihazları listeleme | “Spotify cihazlarımı listele.” |
| Şarkı arama | “Skillet - Monster şarkısını bul.” |
| Belirsiz başlık | “Monster çal.” — Codex'in sanatçı seçmenizi istemesi gerekir. |
| Şarkı açma | “CİHAZ_ADI üzerinde Skillet - Monster şarkısını çal.” |
| Şarkı bağlantısını açma | “Bu Spotify şarkı bağlantısını CİHAZ_ADI üzerinde çal: ŞARKI_BAĞLANTISI.” |
| Çalma listelerini görme | “Spotify kitaplığımdaki çalma listelerini göster.” |
| Çalma listesi başlatma | “Kitaplığımdaki Odak çalma listesini CİHAZ_ADI üzerinde başlat.” |
| Beğenilen Şarkılar | “CİHAZ_ADI üzerinde Beğenilen Şarkılar'ı aç.” |
| Sıraya ekleme | “CİHAZ_ADI üzerinde Skillet - Monster şarkısını sıraya ekle.” |
| Duraklatma / devam | “CİHAZ_ADI üzerinde Spotify'ı duraklat.” / “Spotify'ı devam ettir.” |
| Sonraki / önceki | “CİHAZ_ADI üzerinde sonraki şarkıya geç.” / “Önceki şarkıya dön.” |
| Ses seviyesi | “CİHAZ_ADI üzerinde Spotify sesini yüzde 30 yap.” |
| Çalan parçayı öğrenme | “Spotify'da şu an ne çalıyor?” |

Beğenilen Şarkılar'dan en fazla 100 parça kullanılır; kitaplıkta en fazla 1.000 çalma listesi aranır. Çalma listesinin tamamını sıraya eklemek desteklenmez. Sıra yanıtı isteğin kabulünü bildirir, kuyruktaki konumu doğrulamaz. Zaman aşımından sonra tekrar denemeden önce Spotify kuyruğunu kontrol edin.

## Güncelleme ve kaldırma

Güncellemek için yeni sürümü çıkarın, Install dosyasını çalıştırın ve Codex'i yeniden başlatın. Yetkilendirme verileri paket dışında tutulur ve normalde yeniden kullanılır. İzinler değiştiğinde, bağlantı geçersiz olduğunda veya başka hesap kullanmak istediğinizde yeniden bağlanın.

Kaldırmak için **Spotify Background Controller - Uninstall.cmd** dosyasına çift tıklayın. MCP kaydı kaldırılır. Veri silme sorusunda **Enter veya N verileri korur**; yalnızca açık **Y/Yes** yanıtı siler. Kurulum dosyaları korunur. Ardından Codex'i yeniden başlatın. Bu güvenli varsayılan 1.3.2 için geçerlidir; 1.3.1'de verileri korumak için açıkça **N** yazın.

Çalıştırma sırasında görünen kurulum, kaldırma ve bağlantı mesajları İngilizcedir. Türkçe komut desteği devam eder; Codex kendi yanıt dilini konuşmanıza göre belirler.

## Sorun giderme

| Sorun | Kontrol |
| --- | --- |
| Yeni görevde controller görünmüyor | Yerel Codex görevi kullanın, Codex'i yeniden başlatın; klasör taşındıysa Install'ı tekrar çalıştırın. |
| Codex veya Node bulunamıyor | Eksik ön gereksinimi kurun veya Node'u PATH üzerinde erişilebilir yapın; kurulumu tekrarlayın. |
| Redirect URI hatalı | Geliştirici uygulamasında `http://127.0.0.1:43821/callback` adresini aynen kaydedin. |
| Bağlantı süresi doldu veya yerel port meşgul | Önceki bağlantıyı tamamlayın ya da süresinin dolmasını bekleyip yeni bağlantı isteyin. |
| Spotify erişimi reddediyor | Premium, izin verilen kullanıcı listesi ve kitaplık/oynatma izinlerini kontrol edin. |
| Bilgisayar listelenmiyor | O bilgisayarda Spotify'ı açın, aynı hesapta olduğunuzu kontrol edip cihazları yeniden listeleyin. |
| Güvenli depolama kullanılamıyor | Normal Windows hesabınızla çalıştırın. Yetkilendirme dosyaları hesaplar/bilgisayarlar arasında taşınabilir oturum olarak kullanılamaz. |
| Sıraya ekleme sonucu belirsiz | Komutu tekrarlamadan önce Spotify'ı kontrol edin. |
| Codex araç kullanımı için onay istiyor | Codex onay ayarlarınız geçerlidir; controller bunları atlamaz. |
| Eklenti bütünlük doğrulaması başarısız | Resmî Release ZIP'ini yeniden çıkartın. `.codex-plugin/plugin.json`, imza veya public key dosyasını değiştirmeyin ve silmeyin. |

[Veri saklama bilgileri](SECURITY.md). Sorun bildirirken sürümü, Windows sürümünü ve gizli bilgiler çıkarılmış hata metnini ekleyin; yetkilendirme verilerini paylaşmayın.
