/**
 * Modern Professional layout — 3 column design
 * Left: vertical social icons in pill box
 * Middle: Logo, Name, Title, Company, Info (+ avatar nested beside info)
 * Right: Promotional content blocks / image
 */
export const MODERN_PROFESSIONAL_SIGNATURE_TEMPLATE = `<style type="text/css">
@media only screen and (min-width:601px),
  only screen and (min-device-width:601px) {
  tr.sig-blocks-stacked-row {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  td.sig-blocks-desktop {
    display: table-cell !important;
  }
  td.sig-content-block-cell-left {
    padding-right: 12px !important;
  }
  td.sig-content-block-cell-right {
    padding-left: 12px !important;
    border-left: 1px solid #e5e5e5 !important;
    border-top: none !important;
  }
}
@media only screen and (max-width:600px),
  only screen and (max-width:768px),
  only screen and (max-device-width:600px),
  only screen and (max-device-width:812px) {
  table.sig-root-layout-table,
  table.sig-mp-header-layout-table {
    table-layout: auto !important;
    width: 100% !important;
  }
  td.sig-blocks-desktop {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  tr.sig-blocks-stacked-row {
    display: table-row !important;
  }
  td.sig-content-block-cell {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    box-sizing: border-box !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 12px !important;
  }
  td.sig-content-block-cell-left {
    padding-bottom: 14px !important;
  }
  td.sig-content-block-cell-right {
    border-left: none !important;
    border-top: 1px solid #e5e5e5 !important;
    padding-top: 14px !important;
    padding-left: 0 !important;
  }
  table.sig-mp-card-shell {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }
}
</style>
<table class="sig-mp-card-shell" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;max-width:660px;width:100%;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background-color:#ffffff;">
  <tr>
    <td style="padding:16px 18px;">
      <table class="sig-mp-header-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#111827; line-height:1.3;">
        <tr>
          <!-- Left Column: Social Icons -->
          {{#if showSocialBlock}}
          <td data-sig-field="socialLinks" class="sig-social-col" width="40" valign="top" style="vertical-align:top;padding-right:12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid #e5e7eb;border-radius:24px;width:40px;text-align:center;">
              <tr><td style="padding-top:8px;padding-bottom:8px;">
                <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                  {{#if hasWebsite}}<tr><td style="padding-bottom:11px;"><a href="{{website}}"><img src="{{iconGlobe}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasLinkedin}}<tr><td style="padding-bottom:11px;"><a href="{{linkedin}}"><img src="{{iconLinkedin}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasInstagram}}<tr><td style="padding-bottom:11px;"><a href="{{instagram}}"><img src="{{iconInstagram}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasFacebook}}<tr><td style="padding-bottom:11px;"><a href="{{facebook}}"><img src="{{iconFacebook}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasYoutube}}<tr><td style="padding-bottom:11px;"><a href="{{youtube}}"><img src="{{iconYoutube}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasReddit}}<tr><td style="padding-bottom:11px;"><a href="{{reddit}}"><img src="{{iconReddit}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasDiscord}}<tr><td style="padding-bottom:11px;"><a href="{{discord}}"><img src="{{iconDiscord}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasBluesky}}<tr><td style="padding-bottom:11px;"><a href="{{bluesky}}"><img src="{{iconBluesky}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                </table>
              </td></tr>
            </table>
          </td>
          {{/if}}

          <!-- Main Column: Info + Avatar (nested) -->
          <td class="sig-mp-main-col" valign="top" style="vertical-align:top;padding-right:12px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
              <tr>
                <td class="sig-info-col" valign="top" style="vertical-align:top;padding-right:12px;">
                  {{mpMiddleColumnHtml}}
                </td>
                {{#if hasAvatar}}
                <td data-sig-field="avatar" class="sig-avatar-col" width="100" valign="top" style="vertical-align:top;width:100px;">
                  <div style="display:inline-block;width:100px;height:92px;overflow:hidden;">
                    <svg width="100" height="92" viewBox="0 0 100 92" style="display:block;" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <clipPath id="sig-mp-avatar-clip">
                          <polygon points="42,0 100,0 73,92 15,92" />
                        </clipPath>
                      </defs>
                      <!-- Horizontal grey line at bottom-left -->
                      <line x1="0" y1="61" x2="15" y2="61" stroke="#e5e7eb" stroke-width="3" />
                      <!-- Thin accent slash -->
                      <polygon points="31,0 37,0 10,92 4,92" fill="#e5e7eb" />
                      <!-- Avatar image with clip path -->
                      <g clip-path="url(#sig-mp-avatar-clip)">
                        <image href="{{avatarUrl}}" x="15" y="0" width="85" height="92" preserveAspectRatio="xMidYMid slice" />
                      </g>
                    </svg>
                  </div>
                </td>
                {{/if}}
              </tr>
            </table>
          </td>

          <!-- Right Column: Promo Blocks / Image -->
          {{#if hasContentBlocks}}
          <td class="sig-blocks-desktop" valign="top" width="220" style="vertical-align:top; border-left:1px solid #e5e7eb; padding-left:16px;">
            {{contentBlocksHtml}}
          </td>
          {{/if}}
        </tr>
      </table>

      <!-- Mobile Content Blocks -->
      {{#if hasContentBlocks}}
      <table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;font-family: {{fontFamily}}, Arial, Helvetica, sans-serif;">
        <tr class="sig-blocks-stacked-row" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
          <td style="padding-top:14px;border-top:1px solid #e5e7eb;margin-top:14px;">
            {{contentBlocksHtmlStacked}}
          </td>
        </tr>
      </table>
      {{/if}}
    </td>
  </tr>
</table>
`;
