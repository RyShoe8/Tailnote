/**
 * Table-based standard layout (logo left, contact right).
 * Content blocks sit in a third column on desktop; on narrow viewports a stacked-style
 * full-width row after divider/address (same HTML twice — only one visible via @media).
 * Uses {{variables}} and {{#if key}}...{{/if}} (non-nested).
 */
export const STANDARD_SIGNATURE_TEMPLATE = `<style type="text/css">
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
  table.sig-root-layout-table {
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
}
</style>
<table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4;width:100%;max-width:660px;">
  <tr>
    <td class="sig-logo-stack" width="{{logoWidth}}" style="vertical-align:top;line-height:0;font-size:0;padding-right:18px;width:{{logoWidth}}px;">
      <table class="sig-logo-address-group" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto;">
        <tr>
          {{#if hasLogo}}
          <td valign="top" style="padding-right:12px;line-height:0;font-size:0;white-space:nowrap;">
            <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:block;">
{{#if hasLogoSizedHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
{{#if hasLogoAutoHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
            </a>
          </td>
          {{/if}}
          {{#if showAddressBlock}}
          <td valign="top" style="font-size:12px;color:#555;line-height:1.35;letter-spacing:0.2px;">
            {{addressBlockHtml}}
          </td>
          {{/if}}
        </tr>
      </table>
    </td>
    <td class="sig-main-stack" style="vertical-align:top; border-left:2px solid {{primaryColor}}; padding-left:14px;padding-right:9px;mso-line-height-rule:exactly;">
      {{#if hasOrderedMainStack}}
      {{orderedMainStackHtml}}
      {{/if}}

      {{#if showSocialBlock}}
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:8px;"><tr>
        {{#if hasLinkedin}}
        <td style="{{socialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconLinkedin}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasFacebook}}
        <td style="{{socialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconFacebook}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasInstagram}}
        <td style="{{socialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconInstagram}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasReddit}}
        <td style="{{socialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconReddit}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasDiscord}}
        <td style="{{socialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconDiscord}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasBluesky}}
        <td style="{{socialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconBluesky}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasYoutube}}
        <td style="{{socialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconYoutube}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
      </tr></table>
      {{/if}}
    </td>
    {{#if sideColumnContentBlocks}}
    <td class="sig-blocks-stack sig-blocks-desktop" valign="top" style="vertical-align:top;padding-left:11px;border-left:1px solid #e5e5e5;width:56%;min-width:218px;">
      {{contentBlocksHtml}}
    </td>
    {{/if}}
  </tr>

  {{#if hasDivider}}
  <tr>
    <td colspan="{{signatureRootColspan}}" style="padding-top:14px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="#e5e5e5" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:#e5e5e5;border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if sideColumnContentBlocks}}
  <tr class="sig-blocks-stacked-row">
    <td colspan="{{signatureRootColspan}}" style="padding-top:12px;">
      {{contentBlocksHtmlStacked}}
    </td>
  </tr>
  {{/if}}
</table>`;
