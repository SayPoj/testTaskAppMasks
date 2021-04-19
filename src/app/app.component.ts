import {ChangeDetectorRef, Component, TemplateRef, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import get from 'get-js';
import {NavigationEnd, Router} from "@angular/router";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('VKModal') public VKModal: TemplateRef<any>;
  user_id;             // id пользователя VK
  user_access_token;   // Ключ доступа пользователя VK
  client_id = 7826370; // Идентификатор приложения VK
  authUrl = 'https://oauth.vk.com/authorize?client_id=' + this.client_id +
    '&redirect_uri=' + window.location.origin + '' +
    '&scope=photos&response_type=token&v=5.130' +
    '&revoke=' + this.isReAuthorization()
    + '&state=now'
  image
  masks = [
    {path: '../assets/masks/1.png'},
    {path: '../assets/masks/2.png'},
    {path: '../assets/masks/3.png'},
    {path: '../assets/masks/4.png'},
    {path: '../assets/masks/5.png'},
    {path: '../assets/masks/6.png'},
    {path: '../assets/masks/7.png'},
    {path: '../assets/masks/8.png'},
    {path: '../assets/masks/9.png'},
    {path: '../assets/masks/10.png'},
    {path: '../assets/masks/11.png'},
    {path: '../assets/masks/12.png'}
  ]
  activeMasks = []
  masksIsCollapsed = true;
  settingsIsCollapsed = true;
  VKUserPhoto; // Аватарка пользователя
  VKPhotos: any[] = []
  isJQuery = false

  isReAuthorization() {
    return localStorage.getItem('re-authorization') ? 0 : 1
  }

  constructor(private http: HttpClient,
              private modalService: NgbModal,
              private router: Router,
              public changeDetector: ChangeDetectorRef) {
    get('https://code.jquery.com/jquery-3.6.0.min.js')
    get('https://code.jquery.com/ui/1.12.0/jquery-ui.min.js').then(() => {
      this.isJQuery = true
      // @ts-ignore
      $('.draggableHelper').draggable()
      // @ts-ignore
      $('.image').resizable()
    })
    router.events.subscribe(s => { // парсинг url
      if (s instanceof NavigationEnd) {
        let params = new URLSearchParams(s.url.split('#')[1]);
        this.user_access_token = params.get('access_token');
        this.user_id = +params.get('user_id');
        let state = params.get('state');

        if (state == 'now') {
          localStorage.clear()
          localStorage.setItem('user_id', this.user_id)
          localStorage.setItem('user_access_token', this.user_access_token)
          localStorage.setItem('access_token_expires_to', Date.now() + params.get('expires_in'))
          this.router.navigate(['/']);
          this.openVKModal(this.VKModal)
          return;
        }

        if ((!this.user_id || !this.user_access_token) && localStorage.getItem('user_access_token') && localStorage.getItem('user_access_token')) {
          if (+localStorage.getItem('access_token_expires_to') <= Date.now()) {
            localStorage.clear()
            localStorage.setItem('re-authorization', '1')
          }
          this.user_access_token = localStorage.getItem('user_access_token')
          this.user_id = localStorage.getItem('user_id')
        }
      }
    })
  }

  getAllPhotos() {
    // @ts-ignore
    if (this.isJQuery) {
      // @ts-ignore
      $.ajax({
        url: 'https://api.vk.com/method/photos.getAll'
          + '?access_token=' + this.user_access_token
          + '&v=5.130'
          + '&owner_id=' + this.user_id
          + '&photo_sizes=1'
        ,
        type: 'GET',
        dataType: 'jsonp',
        crossDomain: true,
        success: data => {
          if (data && data.response && data.response.items[0]) {
            this.VKPhotos = []
            for (let photo of data.response.items) {
              let maxHeight = Math.max(...photo.sizes.map(o => o.height), 0)
              this.VKPhotos.push(photo.sizes.filter(photo => photo.height == maxHeight)[0].url)
            }
          } else {
          localStorage.clear()
        }
        }
      })
      this.getAva()
    } else {
      setTimeout(() => {
        this.getAllPhotos()
      }, 50)
      return
    }
  }

  fileBrowseHandler(files) {
    if (FileReader && files && files.length) {
      var fr = new FileReader();
      fr.onload = () => {
        // @ts-ignore
        this.image = fr.result;
      }
      fr.readAsDataURL(files[0]);
    }
  }

  openVKModal(content) {
    this.modalService.open(content, {centered: true, size: 'xl'});
    this.getAllPhotos()
  }

  closeVKModal() {
    this.modalService.dismissAll()
  }

  getAva() {
    // @ts-ignore
    $.ajax({
      url: 'https://api.vk.com/method/users.get'
        + '?access_token=' + this.user_access_token
        + '&v=5.130'
        + '&user_ids=' + this.user_id
        + '&fields=photo_max_orig',
      type: 'GET',
      dataType: 'jsonp',
      crossDomain: true,
      success: data => {
        if (data && data.response[0] && data.response[0].photo_max_orig) {
          this.VKUserPhoto = data.response[0].photo_max_orig
        } else {
          localStorage.clear()
        }
      }
    })
  }

  addActiveMask(data) {
    this.activeMasks.push(data);
    this.changeDetector.detectChanges()
    // @ts-ignore
    $('.draggableHelper').draggable()
    // @ts-ignore
    $('.image').resizable()

  }

}
